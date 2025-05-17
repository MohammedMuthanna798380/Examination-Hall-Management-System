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
        Schema::create('system.logs', function (Blueprint $table) {
            $table->id();

            // معلومات المستخدم (مبسطة)
            $table->string('user_type'); // نوع المستخدم ('user_a' أو 'user_admins')
            $table->unsignedBigInteger('user_id'); // معرف المستخدم

            // معلومات العملية (مبسطة)
            $table->string('action'); // العملية المنفذة
            $table->string('entity_type')->nullable(); // نوع الكيان (جدول)
            $table->unsignedBigInteger('entity_id')->nullable(); // معرف الكيان

            // معلومات الجلسة
            $table->string('ip_address')->nullable(); // عنوان IP

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
