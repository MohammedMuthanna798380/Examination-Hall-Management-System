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
        Schema::create('system.user_admins', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique(); // اسم المستخدم الفريد

            // صلاحيات التثبيت والترخيص
            $table->boolean('can_install_system')->default(true); // صلاحية تثبيت النظام
            $table->boolean('can_manage_licenses')->default(true); // صلاحية إدارة التراخيص

            // حقول أمنية
            $table->string('installation_password')->nullable(); // كلمة مرور التثبيت (مشفرة)
            $table->boolean('active')->default(true); // حالة الحساب

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_user_admins');
    }
};
