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
        Schema::create('public.exam_schedules', function (Blueprint $table) {
            $table->id();
            $table->date('date'); // Exam date
            $table->enum('period', ['morning', 'evening'])->default('morning'); // Period: morning or evening
            $table->enum('distribution_status', ['complete', 'partial', 'incomplete'])->default('incomplete'); // Distribution status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_schedules');
    }
};
