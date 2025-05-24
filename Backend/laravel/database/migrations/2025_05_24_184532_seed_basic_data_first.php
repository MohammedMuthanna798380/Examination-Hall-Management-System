<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // التحقق من وجود البيانات أولاً لتجنب التكرار
        if (DB::table('system.user_a')->count() > 0) {
            return; // البيانات موجودة بالفعل
        }

        // 1. إدخال المستخدم الإداري أولاً
        DB::table('system.user_a')->insert([
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. إدخال الترخيص
        $licenseId = DB::table('system.licenses')->insertGetId([
            'license_key' => 'EHMS-2024-TRIAL-001',
            'hardware_id' => 'DEMO-HARDWARE-ID',
            'start_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'is_active' => true,
            'created_by' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. إدخال الإعدادات
        $settings = [
            ['key' => 'max_consecutive_absences', 'value' => '2'],
            ['key' => 'auto_suspend_enabled', 'value' => 'true'],
            ['key' => 'notification_email', 'value' => 'admin@university.edu.ye'],
            ['key' => 'system_name', 'value' => 'نظام إدارة المشرفين والملاحظين'],
            ['key' => 'college_name', 'value' => 'كلية الهندسة - جامعة تعز'],
        ];

        foreach ($settings as $setting) {
            DB::table('system.settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 4. إدخال المباني
        $electricalBuildingId = DB::table('public.buildings')->insertGetId([
            'name' => 'مبنى الكهرباء',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $civilBuildingId = DB::table('public.buildings')->insertGetId([
            'name' => 'مبنى المدني',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. إدخال الأدوار
        $electricalFloors = [];
        $floorNames = ['الدور الأول', 'الدور الثاني', 'الدور الثالث', 'الدور الرابع'];

        foreach ($floorNames as $floorName) {
            $electricalFloors[] = DB::table('public.floors')->insertGetId([
                'name' => $floorName,
                'building_id' => $electricalBuildingId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $civilFloors = [];
        $civilFloorNames = ['الدور الأول', 'الدور الثاني'];

        foreach ($civilFloorNames as $floorName) {
            $civilFloors[] = DB::table('public.floors')->insertGetId([
                'name' => $floorName,
                'building_id' => $civilBuildingId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 6. إدخال القاعات
        $rooms = [
            ['name' => 'قاعة 101', 'floor_id' => $electricalFloors[0], 'capacity' => 50],
            ['name' => 'قاعة 102', 'floor_id' => $electricalFloors[0], 'capacity' => 40],
            ['name' => 'قاعة 103', 'floor_id' => $electricalFloors[0], 'capacity' => 45],
            ['name' => 'قاعة 201', 'floor_id' => $electricalFloors[1], 'capacity' => 60],
            ['name' => 'قاعة 202', 'floor_id' => $electricalFloors[1], 'capacity' => 55],
            ['name' => 'قاعة 203', 'floor_id' => $electricalFloors[1], 'capacity' => 50],
            ['name' => 'قاعة 301', 'floor_id' => $electricalFloors[2], 'capacity' => 30],
            ['name' => 'قاعة 302', 'floor_id' => $electricalFloors[2], 'capacity' => 35],
            ['name' => 'قاعة 401', 'floor_id' => $electricalFloors[3], 'capacity' => 70],
            ['name' => 'قاعة 402', 'floor_id' => $electricalFloors[3], 'capacity' => 65],
            ['name' => 'قاعة 101م', 'floor_id' => $civilFloors[0], 'capacity' => 45],
            ['name' => 'قاعة 102م', 'floor_id' => $civilFloors[0], 'capacity' => 40],
            ['name' => 'قاعة 201م', 'floor_id' => $civilFloors[1], 'capacity' => 55],
            ['name' => 'قاعة 202م', 'floor_id' => $civilFloors[1], 'capacity' => 50],
        ];

        foreach ($rooms as $room) {
            DB::table('public.rooms')->insert([
                'name' => $room['name'],
                'floor_id' => $room['floor_id'],
                'capacity' => $room['capacity'],
                'required_supervisors' => $room['capacity'] > 60 ? 2 : 1,
                'required_observers' => min(3, max(1, intval($room['capacity'] / 25))),
                'can_add_observer' => $room['capacity'] > 40,
                'status' => 'available',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 7. إدخال المشرفين والملاحظين
        $users = [
            // المشرفين - موظفي الكلية
            [
                'name' => 'د. أحمد محمد علي',
                'specialization' => 'هندسة كهربائية',
                'phone' => '773123456',
                'whatsapp' => '773123456',
                'type' => 'supervisor',
                'rank' => 'college_employee',
            ],
            [
                'name' => 'د. خالد عبدالله سعيد',
                'specialization' => 'هندسة مدنية',
                'phone' => '774567890',
                'whatsapp' => '774567890',
                'type' => 'supervisor',
                'rank' => 'college_employee',
            ],
            [
                'name' => 'د. محمد صالح أحمد',
                'specialization' => 'هندسة ميكانيكية',
                'phone' => '775234567',
                'whatsapp' => '775234567',
                'type' => 'supervisor',
                'rank' => 'college_employee',
            ],
            [
                'name' => 'د. عبدالرحمن علي محمد',
                'specialization' => 'هندسة حاسوب',
                'phone' => '776345678',
                'whatsapp' => '776345678',
                'type' => 'supervisor',
                'rank' => 'college_employee',
            ],
            // المشرفين - موظفين خارجيين
            [
                'name' => 'م. محمد سعيد ناصر',
                'specialization' => 'هندسة برمجيات',
                'phone' => '776789012',
                'whatsapp' => '776789012',
                'type' => 'supervisor',
                'rank' => 'external_employee',
            ],
            [
                'name' => 'م. عمر خالد محمد',
                'specialization' => 'هندسة شبكات',
                'phone' => '777890123',
                'whatsapp' => '777890123',
                'type' => 'supervisor',
                'rank' => 'external_employee',
            ],
            // الملاحظين - موظفي الكلية
            [
                'name' => 'أ. فاطمة أحمد حسن',
                'specialization' => 'هندسة ميكانيكية',
                'phone' => '775678901',
                'whatsapp' => '775678901',
                'type' => 'observer',
                'rank' => 'college_employee',
            ],
            [
                'name' => 'أ. سارة محمد قاسم',
                'specialization' => 'هندسة حاسوب',
                'phone' => '777890123',
                'whatsapp' => '777890123',
                'type' => 'observer',
                'rank' => 'college_employee',
            ],
            [
                'name' => 'أ. مريم علي عبدالله',
                'specialization' => 'هندسة كهربائية',
                'phone' => '778901234',
                'whatsapp' => '778901234',
                'type' => 'observer',
                'rank' => 'college_employee',
            ],
            [
                'name' => 'أ. زينب محمد صالح',
                'specialization' => 'هندسة مدنية',
                'phone' => '779012345',
                'whatsapp' => '779012345',
                'type' => 'observer',
                'rank' => 'college_employee',
            ],
            // الملاحظين - موظفين خارجيين
            [
                'name' => 'أ. نور علي أحمد',
                'specialization' => 'هندسة مدنية',
                'phone' => '779012345',
                'whatsapp' => '779012345',
                'type' => 'observer',
                'rank' => 'external_employee',
            ],
            [
                'name' => 'أ. زينب محمد علي',
                'specialization' => 'هندسة ميكانيكية',
                'phone' => '770123456',
                'whatsapp' => '770123456',
                'type' => 'observer',
                'rank' => 'external_employee',
            ],
            [
                'name' => 'أ. ليلى عبدالله أحمد',
                'specialization' => 'هندسة حاسوب',
                'phone' => '771234567',
                'whatsapp' => '771234567',
                'type' => 'observer',
                'rank' => 'external_employee',
            ],
            [
                'name' => 'أ. هدى سعيد محمد',
                'specialization' => 'هندسة كهربائية',
                'phone' => '772345678',
                'whatsapp' => '772345678',
                'type' => 'observer',
                'rank' => 'external_employee',
            ],
            [
                'name' => 'أ. أمل أحمد علي',
                'specialization' => 'هندسة برمجيات',
                'phone' => '773456789',
                'whatsapp' => '773456789',
                'type' => 'observer',
                'rank' => 'external_employee',
            ],
        ];

        foreach ($users as $user) {
            DB::table('public.users_s')->insert([
                'name' => $user['name'],
                'specialization' => $user['specialization'],
                'phone' => $user['phone'],
                'whatsapp' => $user['whatsapp'],
                'type' => $user['type'],
                'rank' => $user['rank'],
                'status' => 'active',
                'consecutive_absence_days' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // حذف البيانات بالترتيب العكسي
        DB::table('public.users_s')->truncate();
        DB::table('public.rooms')->truncate();
        DB::table('public.floors')->truncate();
        DB::table('public.buildings')->truncate();
        DB::table('system.settings')->truncate();
        DB::table('system.licenses')->truncate();
        DB::table('system.user_a')->truncate();
    }
};
