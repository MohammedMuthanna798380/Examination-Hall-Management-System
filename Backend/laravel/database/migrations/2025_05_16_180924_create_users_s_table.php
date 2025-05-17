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
        Schema::create('public.users_s', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Full name
            $table->string('specialization')->nullable(); // Specialization
            $table->string('phone')->nullable(); // Phone number
            $table->string('whatsapp')->nullable(); // WhatsApp number
            $table->enum('type', ['supervisor', 'observer']); // Type: supervisor or observer
            $table->enum('rank', ['college_employee', 'external_employee']); // Rank: college employee or external
            $table->enum('status', ['active', 'suspended', 'deleted'])->default('active'); // Status
            $table->integer('consecutive_absence_days')->default(0); // Consecutive absence days
            $table->date('last_absence_date')->nullable(); // Last absence date
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users_s');
    }
};
