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
        Schema::create('public.supervisor_observer_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supervisor_id')->constrained('public.users_s')->onDelete('cascade');
            $table->foreignId('observer_id')->constrained('public.users_s')->onDelete('cascade');
            $table->date('interaction_date');
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->integer('interaction_count')->default(1);
            $table->timestamps();

            // فهرس فريد لمنع التكرار
            $table->unique(['supervisor_id', 'observer_id', 'interaction_date', 'room_id'], 'unique_interaction');

            // فهارس للبحث
            $table->index(['supervisor_id', 'observer_id']);
            $table->index(['interaction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.supervisor_observer_interactions');
    }
};
