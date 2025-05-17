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
        Schema::create('public.absence_replacements', function (Blueprint $table) {
            $table->id();
            $table->date('date'); // Date of absence/replacement
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->foreignId('original_user_id')->constrained('public.users')->onDelete('cascade');
            $table->foreignId('replacement_user_id')->nullable()->constrained('public.users')->onDelete('set null');
            $table->enum('action_type', ['absence', 'auto_replacement', 'manual_replacement']); // Type of action
            $table->string('reason')->nullable(); // Reason for absence/replacement
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absence_replacements');
    }
};
