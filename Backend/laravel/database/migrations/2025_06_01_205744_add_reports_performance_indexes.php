<?php
// Backend/laravel/database/migrations/2025_06_01_120000_add_reports_performance_indexes.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // إضافة فهارس لتحسين أداء التقارير

        // فهارس جدول daily_assignments للتقارير
        Schema::table('public.daily_assignments', function (Blueprint $table) {
            // فهرس للبحث حسب التاريخ والمشرف
            $table->index(['assignment_date', 'supervisor_id'], 'idx_daily_assignments_date_supervisor');

            // فهرس للبحث حسب التاريخ والفترة والحالة
            $table->index(['assignment_date', 'period', 'status'], 'idx_daily_assignments_date_period_status');
        });

        // فهارس جدول absence_replacements للتقارير
        Schema::table('public.absence_replacements', function (Blueprint $table) {
            // فهرس للبحث حسب التاريخ ونوع الإجراء
            $table->index(['date', 'action_type'], 'idx_absence_replacements_date_action');

            // فهرس للبحث حسب المستخدم الأصلي والتاريخ
            $table->index(['original_user_id', 'date'], 'idx_absence_replacements_user_date');
        });

        // فهارس جدول users_s للتقارير
        Schema::table('public.users_s', function (Blueprint $table) {
            // فهرس للبحث حسب النوع والحالة والرتبة
            $table->index(['type', 'status', 'rank'], 'idx_users_type_status_rank');

            // فهرس للبحث حسب الحالة وعدد أيام الغياب
            $table->index(['status', 'consecutive_absence_days'], 'idx_users_status_absence_days');
        });

        // فهارس جدول rooms للتقارير
        Schema::table('public.rooms', function (Blueprint $table) {
            // فهرس للبحث حسب الحالة والسعة
            $table->index(['status', 'capacity'], 'idx_rooms_status_capacity');
        });

        // إنشاء views لتحسين أداء التقارير المعقدة

        // View لإحصائيات الحضور اليومية
        DB::statement("
            CREATE OR REPLACE VIEW public.daily_attendance_stats AS
            SELECT
                da.assignment_date,
                da.period,
                COUNT(DISTINCT da.room_id) as total_rooms,
                COUNT(DISTINCT da.supervisor_id) as assigned_supervisors,
                COALESCE(SUM(CASE WHEN da.observer_ids IS NOT NULL
                    THEN array_length(da.observer_ids, 1)
                    ELSE 0 END), 0) as assigned_observers,
                COUNT(DISTINCT ar.original_user_id) as absent_users
            FROM public.daily_assignments da
            LEFT JOIN public.absence_replacements ar
                ON da.assignment_date = ar.date
                AND ar.action_type = 'absence'
            GROUP BY da.assignment_date, da.period
        ");

        // View لإحصائيات استخدام القاعات
        DB::statement("
            CREATE OR REPLACE VIEW public.room_usage_stats AS
            SELECT
                r.id as room_id,
                r.name as room_name,
                b.name as building_name,
                f.name as floor_name,
                r.capacity,
                COUNT(da.id) as total_usage,
                COUNT(DISTINCT da.assignment_date) as unique_days,
                AVG(CASE WHEN da.observer_ids IS NOT NULL
                    THEN array_length(da.observer_ids, 1)
                    ELSE 0 END) as avg_observers
            FROM public.rooms r
            JOIN public.floors f ON r.floor_id = f.id
            JOIN public.buildings b ON f.building_id = b.id
            LEFT JOIN public.daily_assignments da ON r.id = da.room_id
            WHERE r.status = 'available'
            GROUP BY r.id, r.name, b.name, f.name, r.capacity
        ");

        // View لإحصائيات المستخدمين
        DB::statement("
            CREATE OR REPLACE VIEW public.user_performance_stats AS
            SELECT
                u.id as user_id,
                u.name,
                u.type,
                u.rank,
                u.status,
                u.consecutive_absence_days,
                COUNT(DISTINCT ah.assignment_date) as total_assignments,
                COUNT(DISTINCT ar.date) as total_absences,
                CASE
                    WHEN COUNT(DISTINCT ah.assignment_date) > 0
                    THEN ROUND(
                        (COUNT(DISTINCT ah.assignment_date) - COUNT(DISTINCT ar.date)) * 100.0 /
                        COUNT(DISTINCT ah.assignment_date), 2
                    )
                    ELSE 0
                END as attendance_rate
            FROM public.users_s u
            LEFT JOIN public.assignment_history ah ON u.id = ah.user_id
            LEFT JOIN public.absence_replacements ar
                ON u.id = ar.original_user_id
                AND ar.action_type = 'absence'
            WHERE u.status != 'deleted'
            GROUP BY u.id, u.name, u.type, u.rank, u.status, u.consecutive_absence_days
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // حذف الـ Views أولاً
        DB::statement("DROP VIEW IF EXISTS public.user_performance_stats");
        DB::statement("DROP VIEW IF EXISTS public.room_usage_stats");
        DB::statement("DROP VIEW IF EXISTS public.daily_attendance_stats");

        // حذف الفهارس
        Schema::table('public.daily_assignments', function (Blueprint $table) {
            $table->dropIndex('idx_daily_assignments_date_supervisor');
            $table->dropIndex('idx_daily_assignments_date_period_status');
        });

        Schema::table('public.absence_replacements', function (Blueprint $table) {
            $table->dropIndex('idx_absence_replacements_date_action');
            $table->dropIndex('idx_absence_replacements_user_date');
        });

        Schema::table('public.users_s', function (Blueprint $table) {
            $table->dropIndex('idx_users_type_status_rank');
            $table->dropIndex('idx_users_status_absence_days');
        });

        Schema::table('public.rooms', function (Blueprint $table) {
            $table->dropIndex('idx_rooms_status_capacity');
        });
    }
};
