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
        Schema::create('public.assignments', function (Blueprint $table) {
            $table->id();
            $table->date('date'); // Assignment date
            $table->enum('period', ['morning', 'evening'])->default('morning'); // Period
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->foreignId('supervisor_id')->nullable()->constrained('public.users_s')->onDelete('set null');
            $table->enum('status', ['complete', 'incomplete'])->default('incomplete'); // Status
            $table->enum('assignment_type', ['automatic', 'manual', 'temporary'])->default('automatic'); // Type of assignment
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
