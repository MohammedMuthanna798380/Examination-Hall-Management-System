<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // التحقق من وجود البيانات الأساسية أولاً
        // if (DB::table('public.users_s')->count() == 0) {
        //     $this->command->error('يجب تشغيل migration البيانات الأساسية أولاً');
        //     return;
        // }

        // إدخال قواعد التوزيع الافتراضية
        $distributionRules = [
            [
                'rule_name' => 'no_same_room_repetition',
                'rule_description' => 'عدم تكرار المشرف/الملاحظ في نفس القاعة',
                'rule_parameters' => json_encode(['max_repetitions' => 0, 'period_days' => 30]),
                'is_active' => true,
                'priority' => 1,
            ],
            [
                'rule_name' => 'no_supervisor_observer_repetition',
                'rule_description' => 'عدم تكرار الملاحظ مع نفس المشرف',
                'rule_parameters' => json_encode(['max_interactions' => 0, 'period_days' => 30]),
                'is_active' => true,
                'priority' => 2,
            ],
            [
                'rule_name' => 'college_employee_priority',
                'rule_description' => 'أولوية موظفي الكلية',
                'rule_parameters' => json_encode(['priority_weight' => 10]),
                'is_active' => true,
                'priority' => 3,
            ],
            [
                'rule_name' => 'fair_distribution',
                'rule_description' => 'التوزيع العادل بين الموظفين',
                'rule_parameters' => json_encode(['max_assignments_per_week' => 5]),
                'is_active' => true,
                'priority' => 4,
            ],
            [
                'rule_name' => 'auto_suspend_after_absence',
                'rule_description' => 'التعليق التلقائي بعد الغياب المتكرر',
                'rule_parameters' => json_encode(['max_consecutive_absences' => 2]),
                'is_active' => true,
                'priority' => 5,
            ],
        ];

        foreach ($distributionRules as $rule) {
            DB::table('public.distribution_rules')->insert([
                'rule_name' => $rule['rule_name'],
                'rule_description' => $rule['rule_description'],
                'rule_parameters' => $rule['rule_parameters'],
                'is_active' => $rule['is_active'],
                'priority' => $rule['priority'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // إدخال بعض البيانات التاريخية للتوزيع
        $today = Carbon::today();
        $lastWeek = $today->copy()->subWeek();

        // إنشاء تاريخ توزيعات سابقة
        for ($i = 0; $i < 7; $i++) {
            $date = $lastWeek->copy()->addDays($i);

            if ($date->isWeekday()) { // أيام العمل فقط
                // توزيعات المشرفين
                $supervisors = [1, 2, 3, 4]; // أول 4 مشرفين
                $observers = [7, 8, 9, 10, 11]; // أول 5 ملاحظين
                $rooms = [1, 2, 3, 4]; // أول 4 قاعات

                foreach ($rooms as $index => $roomId) {
                    $supervisorId = $supervisors[$index % count($supervisors)];

                    // إدخال سجل التوزيع التاريخي للمشرف
                    DB::table('public.assignment_history')->insert([
                        'date' => $date->format('Y-m-d'),
                        'period' => 'morning',
                        'user_id' => $supervisorId,
                        'room_id' => $roomId,
                        'user_type' => 'supervisor',
                        'participation_count' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // إدخال سجل التوزيع التاريخي للملاحظين
                    $roomObservers = array_slice($observers, ($index * 2) % count($observers), 2);
                    foreach ($roomObservers as $observerId) {
                        DB::table('public.assignment_history')->insert([
                            'date' => $date->format('Y-m-d'),
                            'period' => 'morning',
                            'user_id' => $observerId,
                            'room_id' => $roomId,
                            'user_type' => 'observer',
                            'participation_count' => 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        // إدخال سجل التفاعل بين المشرف والملاحظ
                        DB::table('public.supervisor_observer_interactions')->insert([
                            'supervisor_id' => $supervisorId,
                            'observer_id' => $observerId,
                            'interaction_date' => $date->format('Y-m-d'),
                            'room_id' => $roomId,
                            'interaction_count' => 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }

        // إدخال بعض المستخدمين المؤقتين
        $temporaryUsers = [
            [
                'name' => 'أ. مؤقت أحمد محمد',
                'phone' => '774444444',
                'type' => 'observer',
                'assignment_date' => $today->copy()->addDay()->format('Y-m-d'),
                'period' => 'morning',
                'room_id' => 5,
                'notes' => 'ملاحظ مؤقت لحالة طارئة',
                'is_used' => false,
            ],
            [
                'name' => 'د. مؤقت سعيد علي',
                'phone' => '775555555',
                'type' => 'supervisor',
                'assignment_date' => $today->copy()->addDays(2)->format('Y-m-d'),
                'period' => 'evening',
                'room_id' => 6,
                'notes' => 'مشرف مؤقت للفترة المسائية',
                'is_used' => false,
            ],
        ];

        foreach ($temporaryUsers as $tempUser) {
            DB::table('public.temporary_users')->insert([
                'name' => $tempUser['name'],
                'phone' => $tempUser['phone'],
                'type' => $tempUser['type'],
                'assignment_date' => $tempUser['assignment_date'],
                'period' => $tempUser['period'],
                'room_id' => $tempUser['room_id'],
                'notes' => $tempUser['notes'],
                'is_used' => $tempUser['is_used'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // إنشاء تقرير محفوظ كمثال
        DB::table('public.saved_reports')->insert([
            'report_name' => 'تقرير التوزيع اليومي - أسبوع تجريبي',
            'report_type' => 'daily_distribution',
            'report_parameters' => json_encode([
                'start_date' => $lastWeek->format('Y-m-d'),
                'end_date' => $lastWeek->copy()->addWeek()->format('Y-m-d'),
                'include_absences' => true,
                'include_replacements' => true,
            ]),
            'report_date' => $today->format('Y-m-d'),
            'report_data' => json_encode([
                'total_assignments' => 28,
                'total_supervisors' => 4,
                'total_observers' => 5,
                'total_rooms' => 4,
                'absence_rate' => 5.2,
            ]),
            'created_by' => 1, // المستخدم الإداري الأول
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // تحديث عدد مرات المشاركة في جدول users_s بناءً على البيانات التاريخية
        $participationCounts = DB::table('public.assignment_history')
            ->select('user_id', DB::raw('count(*) as total_count'))
            ->groupBy('user_id')
            ->get();

        foreach ($participationCounts as $participation) {
            DB::table('public.users_s')
                ->where('id', $participation->user_id)
                ->update([
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('public.saved_reports')->truncate();
        DB::table('public.temporary_users')->truncate();
        DB::table('public.supervisor_observer_interactions')->truncate();
        DB::table('public.assignment_history')->truncate();
        DB::table('public.distribution_rules')->truncate();
    }
};
