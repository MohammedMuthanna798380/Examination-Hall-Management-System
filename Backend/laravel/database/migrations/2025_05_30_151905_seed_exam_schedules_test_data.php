<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // التحقق من وجود البيانات الأساسية
        if (DB::table('public.rooms')->count() == 0) {
            echo "يجب تشغيل migration البيانات الأساسية أولاً\n";
            return;
        }

        // الحصول على القاعات المتاحة
        $availableRooms = DB::table('public.rooms')
            ->where('status', 'available')
            ->pluck('id')
            ->toArray();

        if (empty($availableRooms)) {
            echo "لا توجد قاعات متاحة لإنشاء جداول امتحانات\n";
            return;
        }

        // تواريخ الامتحانات (أسبوع كامل بدءاً من اليوم)
        $today = Carbon::today();
        $examDates = [];

        for ($i = 0; $i < 7; $i++) {
            $date = $today->copy()->addDays($i);
            // تجنب أيام الجمعة والسبت (عطلة نهاية الأسبوع)
            if (!$date->isFriday() && !$date->isSaturday()) {
                $examDates[] = $date->format('Y-m-d');
            }
        }

        // إضافة أسبوع آخر
        for ($i = 7; $i < 14; $i++) {
            $date = $today->copy()->addDays($i);
            if (!$date->isFriday() && !$date->isSaturday()) {
                $examDates[] = $date->format('Y-m-d');
            }
        }

        // جداول الامتحانات التجريبية
        $examSchedules = [];
        $scheduleId = 1;

        foreach ($examDates as $index => $date) {
            // جدول صباحي
            $morningRooms = $this->getRandomRooms($availableRooms, rand(2, 5));
            if (!empty($morningRooms)) {
                $examSchedules[] = [
                    'id' => $scheduleId++,
                    'date' => $date,
                    'period' => 'morning',
                    'distribution_status' => $this->getRandomStatus($index),
                    'rooms' => $morningRooms,
                ];
            }

            // جدول مسائي (ليس كل يوم)
            if (rand(0, 1)) {
                $eveningRooms = $this->getRandomRooms($availableRooms, rand(1, 3));
                if (!empty($eveningRooms)) {
                    $examSchedules[] = [
                        'id' => $scheduleId++,
                        'date' => $date,
                        'period' => 'evening',
                        'distribution_status' => $this->getRandomStatus($index),
                        'rooms' => $eveningRooms,
                    ];
                }
            }
        }

        // إدخال جداول الامتحانات
        foreach ($examSchedules as $schedule) {
            // التحقق من عدم وجود جدول بنفس التاريخ والفترة
            $existing = DB::table('public.exam_schedules')
                ->where('date', $schedule['date'])
                ->where('period', $schedule['period'])
                ->first();

            if ($existing) {
                continue; // تجاهل إذا كان موجوداً
            }

            // إدخال الجدول الأساسي
            $examScheduleId = DB::table('public.exam_schedules')->insertGetId([
                'date' => $schedule['date'],
                'period' => $schedule['period'],
                'distribution_status' => $schedule['distribution_status'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // ربط القاعات بالجدول
            foreach ($schedule['rooms'] as $roomId) {
                DB::table('public.exam_schedule_room')->insert([
                    'exam_schedule_id' => $examScheduleId,
                    'room_id' => $roomId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // إنشاء توزيعات للجداول المكتملة
            if ($schedule['distribution_status'] === 'complete') {
                $this->createAssignments($examScheduleId, $schedule['date'], $schedule['period'], $schedule['rooms']);
            } elseif ($schedule['distribution_status'] === 'partial') {
                // إنشاء توزيعات جزئية (نصف القاعات فقط)
                $partialRooms = array_slice($schedule['rooms'], 0, ceil(count($schedule['rooms']) / 2));
                $this->createAssignments($examScheduleId, $schedule['date'], $schedule['period'], $partialRooms);
            }
        }

        // إضافة بعض الإشعارات للجداول غير المكتملة
        $this->createNotifications();

        echo "تم إنشاء " . count($examSchedules) . " جدول امتحان تجريبي بنجاح\n";
    }

    /**
     * اختيار قاعات عشوائية
     */
    private function getRandomRooms($availableRooms, $count)
    {
        $shuffled = collect($availableRooms)->shuffle();
        return $shuffled->take(min($count, count($availableRooms)))->toArray();
    }

    /**
     * تحديد حالة عشوائية للتوزيع
     */
    private function getRandomStatus($index)
    {
        // الجداول القديمة تكون مكتملة أكثر
        if ($index < 3) {
            return collect(['complete', 'complete', 'partial'])->random();
        } elseif ($index < 6) {
            return collect(['complete', 'partial', 'incomplete'])->random();
        } else {
            return collect(['incomplete', 'incomplete', 'partial'])->random();
        }
    }

    /**
     * إنشاء توزيعات للمشرفين والملاحظين
     */
    private function createAssignments($examScheduleId, $date, $period, $roomIds)
    {
        // الحصول على المشرفين والملاحظين المتاحين
        $supervisors = DB::table('public.users_s')
            ->where('type', 'supervisor')
            ->where('status', 'active')
            ->pluck('id')
            ->toArray();

        $observers = DB::table('public.users_s')
            ->where('type', 'observer')
            ->where('status', 'active')
            ->pluck('id')
            ->toArray();

        if (empty($supervisors) || empty($observers)) {
            return;
        }

        foreach ($roomIds as $roomId) {
            // الحصول على متطلبات القاعة
            $room = DB::table('public.rooms')->where('id', $roomId)->first();

            if (!$room) continue;

            // اختيار مشرف عشوائي
            $supervisorId = collect($supervisors)->random();

            // إنشاء سجل التوزيع
            $assignmentId = DB::table('public.assignments')->insertGetId([
                'date' => $date,
                'period' => $period,
                'room_id' => $roomId,
                'supervisor_id' => $supervisorId,
                'status' => 'complete',
                'assignment_type' => 'automatic',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // اختيار ملاحظين عشوائيين
            $requiredObservers = $room->required_observers;
            $selectedObservers = collect($observers)->shuffle()->take($requiredObservers);

            foreach ($selectedObservers as $observerId) {
                DB::table('public.assignment_observer')->insert([
                    'assignment_id' => $assignmentId,
                    'users_s_id' => $observerId,
                    'assignment_type' => 'automatic',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * إنشاء إشعارات للنقص
     */
    private function createNotifications()
    {
        // إنشاء بعض الإشعارات العشوائية للقاعات التي تعاني من نقص
        $incompleteSchedules = DB::table('public.exam_schedules')
            ->where('distribution_status', 'incomplete')
            ->limit(3)
            ->get();

        foreach ($incompleteSchedules as $schedule) {
            // الحصول على قاعات هذا الجدول
            $roomIds = DB::table('public.exam_schedule_room')
                ->where('exam_schedule_id', $schedule->id)
                ->pluck('room_id')
                ->toArray();

            // إنشاء إشعار نقص لقاعة عشوائية
            if (!empty($roomIds)) {
                $randomRoomId = collect($roomIds)->random();
                $deficiencyType = collect(['supervisor', 'observer'])->random();

                DB::table('public.notifications')->insert([
                    'date' => $schedule->date,
                    'room_id' => $randomRoomId,
                    'deficiency_type' => $deficiencyType,
                    'status' => 'unresolved',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // حذف البيانات التجريبية بترتيب آمن
        DB::table('public.notifications')->where('created_at', '>=', now()->subHour())->delete();

        $recentSchedules = DB::table('public.exam_schedules')
            ->where('created_at', '>=', now()->subHour())
            ->pluck('id');

        if ($recentSchedules->isNotEmpty()) {
            // حذف العلاقات أولاً
            DB::table('public.assignment_observer')
                ->whereIn('assignment_id', function ($query) use ($recentSchedules) {
                    $query->select('id')
                        ->from('public.assignments')
                        ->where('created_at', '>=', now()->subHour());
                })
                ->delete();

            DB::table('public.assignments')
                ->where('created_at', '>=', now()->subHour())
                ->delete();

            DB::table('public.exam_schedule_room')
                ->whereIn('exam_schedule_id', $recentSchedules)
                ->delete();

            DB::table('public.exam_schedules')
                ->whereIn('id', $recentSchedules)
                ->delete();
        }
    }
};
