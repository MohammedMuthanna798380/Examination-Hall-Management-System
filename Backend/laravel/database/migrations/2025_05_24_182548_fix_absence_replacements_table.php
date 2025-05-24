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
        // تعديل جدول absence_replacements لربطه بـ users_s
        Schema::table('public.absence_replacements', function (Blueprint $table) {
            // حذف المفاتيح الخارجية القديمة
            $table->dropForeign(['original_user_id']);
            $table->dropForeign(['replacement_user_id']);

            // إضافة المفاتيح الخارجية الجديدة
            $table->foreign('original_user_id')
                ->references('id')
                ->on('public.users_s')
                ->onDelete('cascade');

            $table->foreign('replacement_user_id')
                ->references('id')
                ->on('public.users_s')
                ->onDelete('set null');

            // تغيير نوع حقل reason
            $table->text('reason')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('public.absence_replacements', function (Blueprint $table) {
            $table->dropForeign(['original_user_id']);
            $table->dropForeign(['replacement_user_id']);

            $table->foreign('original_user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('replacement_user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
