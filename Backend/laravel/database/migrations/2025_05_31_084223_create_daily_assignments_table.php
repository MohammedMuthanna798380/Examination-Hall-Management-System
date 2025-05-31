<?php
// Backend/laravel/database/migrations/2025_05_30_160000_create_daily_assignments_table.php

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
        Schema::create('public.daily_assignments', function (Blueprint $table) {
            $table->id();
            $table->date('assignment_date'); // تاريخ التوزيع
            $table->enum('period', ['morning', 'evening'])->default('morning'); // الفترة
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->foreignId('supervisor_id')->nullable()->constrained('public.users_s')->onDelete('set null');
            $table->json('observer_ids')->nullable(); // مصفوفة معرفات الملاحظين
            $table->enum('status', ['complete', 'partial', 'incomplete'])->default('incomplete');
            $table->enum('assignment_type', ['automatic', 'manual'])->default('automatic');
            $table->text('notes')->nullable(); // ملاحظات
            $table->timestamps();

            // فهارس للبحث السريع
            $table->index(['assignment_date', 'period']);
            $table->index(['room_id', 'assignment_date']);
            $table->index(['supervisor_id', 'assignment_date']);
        });

        // جدول لتتبع تاريخ التوزيعات
        Schema::create('public.assignment_history', function (Blueprint $table) {
            $table->id();
            $table->date('assignment_date');
            $table->enum('period', ['morning', 'evening']);
            $table->foreignId('user_id')->constrained('public.users_s')->onDelete('cascade');
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->enum('user_type', ['supervisor', 'observer']);
            $table->foreignId('supervisor_id')->nullable()->constrained('public.users_s')->onDelete('set null'); // للملاحظين فقط
            $table->timestamps();

            // فهارس
            $table->index(['user_id', 'assignment_date']);
            $table->index(['room_id', 'assignment_date']);
            $table->index(['assignment_date', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.assignment_history');
        Schema::dropIfExists('public.daily_assignments');
    }
};
