<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserASeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('system.user_a')->insert([
            'username' => 'Doaa',
            'password' => Hash::make('MD499476'), // تأكد من تغيير كلمة المرور لاحقًا
            'role' => 'admin',
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
