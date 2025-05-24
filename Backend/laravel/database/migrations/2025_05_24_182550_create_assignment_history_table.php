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
        Schema::create('public.assignment_history', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->enum('period', ['morning', 'evening']);
            $table->foreignId('user_id')->constrained('public.users_s')->onDelete('cascade');
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->enum('user_type', ['supervisor', 'observer']);
            $table->integer('participation_count')->default(1); // عدد مرات المشاركة
            $table->timestamps();

            // فهارس للبحث السريع
            $table->index(['user_id', 'date']);
            $table->index(['room_id', 'date']);
            $table->index(['date', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.assignment_history');
    }
};
