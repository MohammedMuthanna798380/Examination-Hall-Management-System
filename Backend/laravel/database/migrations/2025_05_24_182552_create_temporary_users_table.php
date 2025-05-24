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
        Schema::create('public.temporary_users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->enum('type', ['supervisor', 'observer']);
            $table->date('assignment_date'); // التاريخ المحدد للعمل
            $table->enum('period', ['morning', 'evening']);
            $table->foreignId('room_id')->constrained('public.rooms')->onDelete('cascade');
            $table->text('notes')->nullable(); // ملاحظات إضافية
            $table->boolean('is_used')->default(false); // هل تم استخدامه
            $table->timestamps();

            // فهرس للبحث حسب التاريخ والفترة
            $table->index(['assignment_date', 'period']);
            $table->index(['is_used']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('public.temporary_users');
    }
};
