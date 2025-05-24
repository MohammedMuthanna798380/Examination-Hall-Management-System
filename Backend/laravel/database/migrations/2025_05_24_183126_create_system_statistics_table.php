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
        Schema::create('public.system_statistics', function (Blueprint $table) {
            $table->id();
            $table->date('statistics_date');
            $table->enum('period', ['daily', 'weekly', 'monthly'])->default('daily');

            // إحصائيات التوزيع
            $table->integer('total_assignments')->default(0);
            $table->integer('total_supervisors_assigned')->default(0);
            $table->integer('total_observers_assigned')->default(0);
            $table->integer('total_rooms_used')->default(0);

            // إحصائيات الغياب
            $table->integer('total_absences')->default(0);
            $table->integer('total_replacements')->default(0);
            $table->decimal('absence_rate', 5, 2)->default(0.00); // نسبة الغياب

            // إحصائيات الأداء
            $table->integer('complete_distributions')->default(0);
            $table->integer('incomplete_distributions')->default(0);
            $table->decimal('distribution_success_rate', 5, 2)->default(0.00);

            // إحصائيات المستخدمين
            $table->integer('active_supervisors')->default(0);
            $table->integer('active_observers')->default(0);
            $table->integer('suspended_users')->default(0);

            // إحصائيات القاعات
            $table->integer('available_rooms')->default(0);
            $table->decimal('room_utilization_rate', 5, 2)->default(0.00);

            $table->timestamps();

            // فهرس فريد للتاريخ والفترة
            $table->unique(['statistics_date', 'period']);
            $table->index(['statistics_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.system_statistics');
    }
};
