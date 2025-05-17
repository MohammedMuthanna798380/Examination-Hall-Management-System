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
        Schema::create('public.exam_schedule_room', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_schedule_id')->constrained('public.exam_schedules')->onDelete('cascade');
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_schedule_room');
    }
};
