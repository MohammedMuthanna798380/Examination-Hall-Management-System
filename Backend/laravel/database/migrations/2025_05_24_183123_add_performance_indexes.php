<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // إضافة فهارس لتحسين الأداء في الجداول الموجودة

        // فهارس جدول assignments
        Schema::table('public.assignments', function (Blueprint $table) {
            $table->index(['date', 'period', 'status'], 'idx_assignments_date_period_status');
            $table->index(['supervisor_id', 'date'], 'idx_assignments_supervisor_date');
        });

        // فهارس جدول users_s
        Schema::table('public.users_s', function (Blueprint $table) {
            $table->index(['type', 'rank', 'status'], 'idx_users_type_rank_status');
            $table->index(['status', 'consecutive_absence_days'], 'idx_users_status_absence');
        });

        // فهارس جدول rooms
        Schema::table('public.rooms', function (Blueprint $table) {
            $table->index(['status', 'required_supervisors'], 'idx_rooms_status_supervisors');
            $table->index(['floor_id', 'status'], 'idx_rooms_floor_status');
        });

        // فهارس جدول notifications
        Schema::table('public.notifications', function (Blueprint $table) {
            $table->index(['status', 'date', 'deficiency_type'], 'idx_notifications_status_date_type');
        });

        // فهارس جدول absence_replacements
        Schema::table('public.absence_replacements', function (Blueprint $table) {
            $table->index(['date', 'action_type'], 'idx_absence_date_action');
            $table->index(['original_user_id', 'date'], 'idx_absence_user_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('public.assignments', function (Blueprint $table) {
            $table->dropIndex('idx_assignments_date_period_status');
            $table->dropIndex('idx_assignments_supervisor_date');
        });

        Schema::table('public.users_s', function (Blueprint $table) {
            $table->dropIndex('idx_users_type_rank_status');
            $table->dropIndex('idx_users_status_absence');
        });

        Schema::table('public.rooms', function (Blueprint $table) {
            $table->dropIndex('idx_rooms_status_supervisors');
            $table->dropIndex('idx_rooms_floor_status');
        });

        Schema::table('public.notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_status_date_type');
        });

        Schema::table('public.absence_replacements', function (Blueprint $table) {
            $table->dropIndex('idx_absence_date_action');
            $table->dropIndex('idx_absence_user_date');
        });
    }
};
