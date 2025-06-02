<?php
// Backend/laravel/database/migrations/2025_06_01_100000_seed_daily_assignments_sample_data.php

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
        if (DB::table('public.users_s')->count() == 0 || DB::table('public.rooms')->count() == 0) {
            echo "يجب تشغيل migration البيانات الأساسية أولاً\n";
            return;
        }

        // الحصول على المستخدمين والقاعات
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

        $rooms = DB::table('public.rooms')
            ->where('status', 'available')
            ->get()
            ->toArray();

        if (empty($supervisors) || empty($observers) || empty($rooms)) {
            echo "لا توجد بيانات كافية لإنشاء التوزيعات التجريبية\n";
            return;
        }

        // إنشاء توزيعات تجريبية للأسبوع الماضي والأسبوع الحالي
        $today = Carbon::today();
        $testDates = [];

        // أسبوع ماضي
        for ($i = 7; $i >= 1; $i--) {
            $date = $today->copy()->subDays($i);
            if (!$date->isFriday() && !$date->isSaturday()) {
                $testDates[] = $date;
            }
        }

        // أسبوع حالي (اليوم + الأيام القادمة)
        for ($i = 0; $i < 7; $i++) {
            $date = $today->copy()->addDays($i);
            if (!$date->isFriday() && !$date->isSaturday()) {
                $testDates[] = $date;
            }
        }

        foreach ($testDates as $date) {
            // توزيع صباحي
            $this->createDailyAssignments($date, 'morning', $rooms, $supervisors, $observers);

            // توزيع مسائي (عشوائي)
            if (rand(0, 1)) {
                $this->createDailyAssignments($date, 'evening', $rooms, $supervisors, $observers);
            }
        }

        echo "تم إنشاء بيانات التوزيعات التجريبية بنجاح\n";
    }

    /**
     * إنشاء توزيعات لتاريخ وفترة محددة
     */
    private function createDailyAssignments($date, $period, $rooms, $supervisors, $observers)
    {
        // اختيار عدد عشوائي من القاعات (3-6 قاعات)
        $selectedRooms = collect($rooms)->shuffle()->take(rand(3, 6));

        $usedSupervisors = [];
        $usedObservers = [];

        foreach ($selectedRooms as $room) {
            // اختيار مشرف
            $availableSupervisors = array_diff($supervisors, $usedSupervisors);
            if (empty($availableSupervisors)) {
                $availableSupervisors = $supervisors; // إعادة تعيين إذا انتهت القائمة
                $usedSupervisors = [];
            }

            $selectedSupervisor = collect($availableSupervisors)->random();
            $usedSupervisors[] = $selectedSupervisor;

            // اختيار ملاحظين
            $requiredObservers = $room->required_observers;
            $selectedObservers = [];

            for ($i = 0; $i < $requiredObservers; $i++) {
                $availableObservers = array_diff($observers, $usedObservers, $selectedObservers);
                if (empty($availableObservers)) {
                    break; // لا يوجد ملاحظين متاحين
                }

                $selectedObserver = collect($availableObservers)->random();
                $selectedObservers[] = $selectedObserver;
            }

            $usedObservers = array_merge($usedObservers, $selectedObservers);

            // تحديد حالة التوزيع
            $status = 'complete';
            if (count($selectedObservers) < $requiredObservers) {
                $status = 'partial';
            }

            // إنشاء التوزيع
            $assignmentId = DB::table('public.daily_assignments')->insertGetId([
                'assignment_date' => $date->format('Y-m-d'),
                'period' => $period,
                'room_id' => $room->id,
                'supervisor_id' => $selectedSupervisor,
                'observer_ids' => json_encode($selectedObservers),
                'status' => $status,
                'assignment_type' => 'automatic',
                'notes' => 'توزيع تجريبي - ' . $date->format('Y-m-d'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // إضافة سجل التاريخ للمشرف
            DB::table('public.assignment_history')->insert([
                'assignment_date' => $date->format('Y-m-d'),
                'period' => $period,
                'user_id' => $selectedSupervisor,
                'room_id' => $room->id,
                'user_type' => 'supervisor',
                'supervisor_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // إضافة سجل التاريخ للملاحظين
            foreach ($selectedObservers as $observerId) {
                DB::table('public.assignment_history')->insert([
                    'assignment_date' => $date->format('Y-m-d'),
                    'period' => $period,
                    'user_id' => $observerId,
                    'room_id' => $room->id,
                    'user_type' => 'observer',
                    'supervisor_id' => $selectedSupervisor,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // إضافة بعض حالات الغياب والاستبدال العشوائية
        if (rand(0, 3) == 0) { // 25% احتمال
            $this->addRandomAbsenceData($date, $selectedRooms->first(), $supervisors, $observers);
        }
    }

    /**
     * إضافة بيانات غياب عشوائية
     */
    private function addRandomAbsenceData($date, $room, $supervisors, $observers)
    {
        if (rand(0, 1)) {
            // غياب مشرف
            $supervisor = collect($supervisors)->random();
            $replacement = collect($supervisors)->where('id', '!=', $supervisor)->random();

            DB::table('public.absence_replacements')->insert([
                'date' => $date->format('Y-m-d'),
                'room_id' => $room->id,
                'original_user_id' => $supervisor,
                'replacement_user_id' => $replacement,
                'action_type' => rand(0, 1) ? 'auto_replacement' : 'manual_replacement',
                'reason' => 'سبب تجريبي للاستبدال',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            // غياب ملاحظ
            $observer = collect($observers)->random();

            DB::table('public.absence_replacements')->insert([
                'date' => $date->format('Y-m-d'),
                'room_id' => $room->id,
                'original_user_id' => $observer,
                'replacement_user_id' => null,
                'action_type' => 'absence',
                'reason' => 'غياب تجريبي',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // حذف البيانات التجريبية
        $oneMonthAgo = Carbon::now()->subMonth();

        DB::table('public.absence_replacements')
            ->where('created_at', '>=', $oneMonthAgo)
            ->where('reason', 'LIKE', '%تجريبي%')
            ->delete();

        DB::table('public.assignment_history')
            ->where('created_at', '>=', $oneMonthAgo)
            ->delete();

        DB::table('public.daily_assignments')
            ->where('created_at', '>=', $oneMonthAgo)
            ->where('notes', 'LIKE', '%تجريبي%')
            ->delete();
    }
};
