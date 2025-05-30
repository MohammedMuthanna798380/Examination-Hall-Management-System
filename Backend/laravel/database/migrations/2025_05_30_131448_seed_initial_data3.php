<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //
        DB::table('system.user_a')->insert([
            'username' => 'Mothanna',
            'password' => Hash::make('MD499476'), // تأكد من تغيير كلمة المرور لاحقًا
            'role' => 'admin',
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
