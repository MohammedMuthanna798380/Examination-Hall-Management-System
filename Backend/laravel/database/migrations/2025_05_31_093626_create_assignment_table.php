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
        // إنشاء جدول بسيط للتوزيعات إذا لم يكن موجوداً
        if (!Schema::hasTable('public.assignments')) {
            Schema::create('public.assignments', function (Blueprint $table) {
                $table->id();
                $table->date('date');
                $table->enum('period', ['morning', 'evening'])->default('morning');
                $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
                $table->foreignId('supervisor_id')->nullable()->constrained('public.users_s')->onDelete('set null');
                $table->json('observer_ids')->nullable();
                $table->enum('status', ['complete', 'partial', 'incomplete'])->default('incomplete');
                $table->enum('assignment_type', ['automatic', 'manual'])->default('automatic');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['date', 'period']);
                $table->index(['room_id', 'date']);
            });
        }

        // إنشاء جدول assignment_observer إذا لم يكن موجوداً
        if (!Schema::hasTable('public.assignment_observer')) {
            Schema::create('public.assignment_observer', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->constrained('public.assignments')->onDelete('cascade');
                $table->foreignId('users_s_id')->constrained('public.users_s')->onDelete('cascade');
                $table->enum('assignment_type', ['automatic', 'manual'])->default('automatic');
                $table->timestamps();

                $table->unique(['assignment_id', 'users_s_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.assignment_observer');
        Schema::dropIfExists('public.assignments');
    }
};
