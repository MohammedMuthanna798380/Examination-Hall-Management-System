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
        Schema::create('system.installation_security', function (Blueprint $table) {
            $table->id();
            $table->string('installation_key')->unique(); // مفتاح التثبيت الفريد
            $table->foreignId('license_id')
                ->constrained('system.licenses')
                ->onDelete('cascade'); // علاقة مع الترخيص

            // معلومات التثبيت (مبسطة)
            $table->string('hardware_fingerprint'); // بصمة الجهاز
            $table->datetime('installation_date'); // تاريخ التثبيت

            // معلومات الأمان (مبسطة)
            $table->string('installation_password_hash'); // تجزئة كلمة مرور التثبيت

            // حالة التثبيت
            $table->boolean('is_valid')->default(true); // هل التثبيت صالح

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_installation_security');
    }
};
