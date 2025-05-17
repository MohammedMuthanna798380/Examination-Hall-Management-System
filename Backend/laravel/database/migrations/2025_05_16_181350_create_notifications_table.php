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
        Schema::create('public.notifications', function (Blueprint $table) {
            $table->id();
            $table->date('date'); // Date of notification
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->enum('deficiency_type', ['supervisor', 'observer']); // Type of deficiency
            $table->enum('status', ['resolved', 'unresolved'])->default('unresolved'); // Status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
