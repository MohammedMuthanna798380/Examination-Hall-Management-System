<?php
// إنشاء migration جديد: php artisan make:migration seed_rooms_basic_data

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // التحقق من وجود البيانات أولاً لتجنب التكرار
        if (DB::table('public.buildings')->count() > 0) {
            return; // البيانات موجودة بالفعل
        }

        // إدخال المباني
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

        $mechanicalBuildingId = DB::table('public.buildings')->insertGetId([
            'name' => 'مبنى الميكانيكا',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // إدخال الأدوار للمباني
        $floors = [
            // أدوار مبنى الكهرباء
            ['name' => 'الدور الأول', 'building_id' => $electricalBuildingId],
            ['name' => 'الدور الثاني', 'building_id' => $electricalBuildingId],
            ['name' => 'الدور الثالث', 'building_id' => $electricalBuildingId],
            ['name' => 'الدور الرابع', 'building_id' => $electricalBuildingId],

            // أدوار مبنى المدني
            ['name' => 'الدور الأول', 'building_id' => $civilBuildingId],
            ['name' => 'الدور الثاني', 'building_id' => $civilBuildingId],
            ['name' => 'الدور الثالث', 'building_id' => $civilBuildingId],

            // أدوار مبنى الميكانيكا
            ['name' => 'الدور الأول', 'building_id' => $mechanicalBuildingId],
            ['name' => 'الدور الثاني', 'building_id' => $mechanicalBuildingId],
        ];

        $floorIds = [];
        foreach ($floors as $floor) {
            $floorIds[] = DB::table('public.floors')->insertGetId([
                'name' => $floor['name'],
                'building_id' => $floor['building_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // إدخال القاعات
        $rooms = [
            // قاعات مبنى الكهرباء - الدور الأول
            ['name' => 'قاعة 101', 'floor_id' => $floorIds[0], 'capacity' => 50],
            ['name' => 'قاعة 102', 'floor_id' => $floorIds[0], 'capacity' => 45],
            ['name' => 'قاعة 103', 'floor_id' => $floorIds[0], 'capacity' => 40],
            ['name' => 'قاعة 104', 'floor_id' => $floorIds[0], 'capacity' => 35],

            // قاعات مبنى الكهرباء - الدور الثاني
            ['name' => 'قاعة 201', 'floor_id' => $floorIds[1], 'capacity' => 60],
            ['name' => 'قاعة 202', 'floor_id' => $floorIds[1], 'capacity' => 55],
            ['name' => 'قاعة 203', 'floor_id' => $floorIds[1], 'capacity' => 50],
            ['name' => 'قاعة 204', 'floor_id' => $floorIds[1], 'capacity' => 45],

            // قاعات مبنى الكهरباء - الدور الثالث
            ['name' => 'قاعة 301', 'floor_id' => $floorIds[2], 'capacity' => 30],
            ['name' => 'قاعة 302', 'floor_id' => $floorIds[2], 'capacity' => 35],
            ['name' => 'قاعة 303', 'floor_id' => $floorIds[2], 'capacity' => 40],

            // قاعات مبنى الكهرباء - الدور الرابع
            ['name' => 'قاعة 401', 'floor_id' => $floorIds[3], 'capacity' => 70],
            ['name' => 'قاعة 402', 'floor_id' => $floorIds[3], 'capacity' => 65],
            ['name' => 'قاعة 403', 'floor_id' => $floorIds[3], 'capacity' => 60],

            // قاعات مبنى المدني - الدور الأول
            ['name' => 'قاعة 101م', 'floor_id' => $floorIds[4], 'capacity' => 45],
            ['name' => 'قاعة 102م', 'floor_id' => $floorIds[4], 'capacity' => 40],
            ['name' => 'قاعة 103م', 'floor_id' => $floorIds[4], 'capacity' => 50],

            // قاعات مبنى المدني - الدور الثاني
            ['name' => 'قاعة 201م', 'floor_id' => $floorIds[5], 'capacity' => 55],
            ['name' => 'قاعة 202م', 'floor_id' => $floorIds[5], 'capacity' => 60],
            ['name' => 'قاعة 203م', 'floor_id' => $floorIds[5], 'capacity' => 50],

            // قاعات مبنى المدني - الدور الثالث
            ['name' => 'قاعة 301م', 'floor_id' => $floorIds[6], 'capacity' => 65],
            ['name' => 'قاعة 302م', 'floor_id' => $floorIds[6], 'capacity' => 70],

            // قاعات مبنى الميكانيكا - الدور الأول
            ['name' => 'قاعة 101ميك', 'floor_id' => $floorIds[7], 'capacity' => 40],
            ['name' => 'قاعة 102ميك', 'floor_id' => $floorIds[7], 'capacity' => 45],

            // قاعات مبنى الميكانيكا - الدور الثاني
            ['name' => 'قاعة 201ميك', 'floor_id' => $floorIds[8], 'capacity' => 50],
            ['name' => 'قاعة 202ميك', 'floor_id' => $floorIds[8], 'capacity' => 55],
        ];

        foreach ($rooms as $room) {
            // حساب عدد المشرفين والملاحظين بناءً على السعة
            $requiredSupervisors = $room['capacity'] > 60 ? 2 : 1;
            $requiredObservers = min(4, max(1, intval($room['capacity'] / 20)));
            $canAddObserver = $room['capacity'] > 40;

            DB::table('public.rooms')->insert([
                'name' => $room['name'],
                'floor_id' => $room['floor_id'],
                'capacity' => $room['capacity'],
                'required_supervisors' => $requiredSupervisors,
                'required_observers' => $requiredObservers,
                'can_add_observer' => $canAddObserver,
                'status' => 'available',
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
        DB::table('public.rooms')->truncate();
        DB::table('public.floors')->truncate();
        DB::table('public.buildings')->truncate();
    }
};
