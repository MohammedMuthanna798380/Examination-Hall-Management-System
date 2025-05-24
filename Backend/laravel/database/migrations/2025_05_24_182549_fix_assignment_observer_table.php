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
        // إعادة إنشاء جدول assignment_observer بالتسمية الصحيحة
        Schema::dropIfExists('public.assignment_observer');

        Schema::create('public.assignment_observer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')
                ->constrained('public.assignments')
                ->onDelete('cascade');
            $table->foreignId('users_s_id')
                ->constrained('public.users_s')
                ->onDelete('cascade');
            $table->enum('assignment_type', ['automatic', 'manual', 'temporary'])
                ->default('automatic');
            $table->timestamps();

            // إضافة فهرس فريد
            $table->unique(['assignment_id', 'users_s_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.assignment_observer');

        // إعادة إنشاء الجدول القديم
        Schema::create('public.assignment_observer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('public.assignments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('public.users')->onDelete('cascade');
            $table->enum('assignment_type', ['automatic', 'manual', 'temporary'])->default('automatic');
            $table->timestamps();
        });
    }
};
