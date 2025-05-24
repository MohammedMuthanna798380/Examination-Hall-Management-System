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
        Schema::create('public.saved_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_name');
            $table->enum('report_type', [
                'daily_distribution',
                'supervisor_performance',
                'observer_performance',
                'absence_summary',
                'room_utilization',
                'custom'
            ]);
            $table->json('report_parameters'); // معاملات التقرير
            $table->date('report_date');
            $table->json('report_data'); // بيانات التقرير المحفوظة
            $table->foreignId('created_by')->constrained('system.user_a')->onDelete('cascade');
            $table->timestamps();

            $table->index(['report_type', 'report_date']);
            $table->index(['created_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.saved_reports');
    }
};
