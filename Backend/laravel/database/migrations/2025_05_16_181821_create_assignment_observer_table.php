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
        Schema::create('public.assignment_observer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('public.assignments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('public.users')->onDelete('cascade');
            $table->enum('assignment_type', ['automatic', 'manual', 'temporary'])->default('automatic'); // Type of assignment
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignment_observer');
    }
};
