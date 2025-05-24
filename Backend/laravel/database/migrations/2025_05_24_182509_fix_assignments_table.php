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
        // تعديل جدول assignments لربطه بـ users_s بدلاً من users
        Schema::table('public.assignments', function (Blueprint $table) {
            // حذف المفتاح الخارجي القديم
            $table->dropForeign(['supervisor_id']);

            // إضافة المفتاح الخارجي الجديد
            $table->foreign('supervisor_id')
                ->references('id')
                ->on('public.users_s')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('public.assignments', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->foreign('supervisor_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
