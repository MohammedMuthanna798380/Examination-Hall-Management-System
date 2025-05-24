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
        // تصحيح المفتاح الخارجي في جدول licenses
        Schema::table('system.licenses', function (Blueprint $table) {
            // حذف المفتاح الخارجي القديم إذا كان موجوداً
            $table->dropForeign(['created_by']);

            // إضافة المفتاح الخارجي الصحيح
            $table->foreign('created_by')
                ->references('id')
                ->on('system.user_a')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system.licenses', function (Blueprint $table) {
            $table->dropForeign(['created_by']);

            $table->foreign('created_by')
                ->references('id')
                ->on('system.user_admins')
                ->onDelete('set null');
        });
    }
};
