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
        Schema::create('system.licenses', function (Blueprint $table) {
            $table->id();
            $table->string('license_key')->unique(); // مفتاح الترخيص الفريد
            $table->string('hardware_id')->nullable(); // معرف الجهاز المرتبط بالترخيص

            // مدة الترخيص
            $table->date('start_date'); // تاريخ بدء الترخيص
            $table->date('expiry_date'); // تاريخ انتهاء الترخيص

            // حالة الترخيص
            $table->boolean('is_active')->default(true); // حالة الترخيص

            // علاقة مع من أنشأ الترخيص (مبسطة)
            $table->foreignId('created_by')->nullable()
                ->references('id')
                ->on('system.user_admins')
                ->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_licenses');
    }
};
