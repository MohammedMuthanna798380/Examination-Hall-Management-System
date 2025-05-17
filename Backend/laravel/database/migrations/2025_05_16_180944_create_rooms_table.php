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
        Schema::create('public.rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Name of the room
            $table->foreignId('floor_id')->constrained('public.floors')->onDelete('cascade');
            $table->integer('capacity')->nullable(); // Capacity (number of students)
            $table->integer('required_supervisors')->default(1); // Number of required supervisors
            $table->integer('required_observers')->default(1); // Number of required observers
            $table->boolean('can_add_observer')->default(false); // Can add additional observer
            $table->enum('status', ['available', 'unavailable'])->default('available'); // Status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
