<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\UsersController;
use App\Http\Controllers\API\DashboardController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\API\RoomsController;
use App\Http\Controllers\API\ExamScheduleController;
use App\Http\Controllers\API\DailyAssignmentController;
use App\Http\Controllers\API\AbsenceReplacementController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/check', function () {
    return response()->json(['message' => 'Laravel is connected']);
});

Route::post('/sample', function (Request $request) {
    return response()->json([
        'message' => 'تم الاستلام بنجاح!',
        'data_received' => $request->all()
    ]);
});

// مسارات الاختبار - بدون حماية للتشخيص
Route::get('/debug-info', function () {
    try {
        return response()->json([
            'status' => true,
            'message' => 'Laravel يعمل بشكل صحيح',
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
            'database_connection' => config('database.default'),
            'current_time' => now()->toDateTimeString(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::post('/test-simple-post', function (Request $request) {
    try {
        return response()->json([
            'status' => true,
            'message' => 'POST request يعمل بشكل صحيح',
            'data_received' => $request->all(),
            'method' => $request->method(),
            'headers' => $request->headers->all(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::post('/test-user-creation', function (Request $request) {
    try {
        // تسجيل البيانات الواردة
        Log::info('=== اختبار إنشاء مستخدم ===');
        Log::info('البيانات الواردة:', $request->all());

        // التحقق من اتصال قاعدة البيانات
        DB::connection()->getPdo();
        Log::info('✅ اتصال قاعدة البيانات ناجح');

        // التحقق من وجود الجدول
        $tableExists = Schema::hasTable('public.users_s');
        if (!$tableExists) {
            throw new Exception('جدول users_s غير موجود');
        }
        Log::info('✅ جدول users_s موجود');

        // محاولة إنشاء مستخدم باستخدام DB query builder
        $userData = [
            'name' => $request->input('name', 'اختبار'),
            'specialization' => $request->input('specialization', 'اختبار'),
            'phone' => $request->input('phone', '123456789'),
            'whatsapp' => $request->input('whatsapp', '123456789'),
            'type' => $request->input('type', 'observer'),
            'rank' => $request->input('rank', 'external_employee'),
            'status' => 'active',
            'consecutive_absence_days' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        Log::info('محاولة إدخال البيانات:', $userData);

        $userId = DB::table('public.users_s')->insertGetId($userData);

        Log::info('✅ تم إنشاء المستخدم برقم: ' . $userId);

        // جلب المستخدم المُنشأ
        $createdUser = DB::table('public.users_s')->where('id', $userId)->first();

        return response()->json([
            'status' => true,
            'message' => 'تم إنشاء المستخدم بنجاح عبر query builder',
            'data' => $createdUser
        ]);
    } catch (\Exception $e) {
        Log::error('❌ خطأ في اختبار إنشاء المستخدم:', [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'status' => false,
            'message' => 'فشل في إنشاء المستخدم',
            'error' => $e->getMessage(),
            'debug_info' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'database_connection' => config('database.default'),
            ]
        ], 500);
    }
});

// اختبار Eloquent Model
Route::post('/test-eloquent-user', function (Request $request) {
    try {
        Log::info('=== اختبار Eloquent Model ===');

        $user = new \App\Models\Users_s();
        $user->name = $request->input('name', 'اختبار eloquent');
        $user->specialization = $request->input('specialization', 'اختبار');
        $user->phone = $request->input('phone', '987654321');
        $user->whatsapp = $request->input('whatsapp', '987654321');
        $user->type = $request->input('type', 'observer');
        $user->rank = $request->input('rank', 'external_employee');
        $user->status = 'active';
        $user->consecutive_absence_days = 0;

        $user->save();

        Log::info('✅ تم إنشاء المستخدم بالEloquent برقم: ' . $user->id);

        return response()->json([
            'status' => true,
            'message' => 'تم إنشاء المستخدم بنجاح عبر Eloquent',
            'data' => $user
        ]);
    } catch (\Exception $e) {
        Log::error('❌ خطأ في اختبار Eloquent:', [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);

        return response()->json([
            'status' => false,
            'message' => 'فشل في إنشاء المستخدم بالEloquent',
            'error' => $e->getMessage()
        ], 500);
    }
});

// مسار تسجيل الدخول - بدون حماية
Route::post('/login', [LoginController::class, 'login']);

// إضافة مسار اختبار المستخدمين بدون حماية للتشخيص
Route::post('/test-users-unprotected', [UsersController::class, 'store']);
Route::get('/test-users-list', [UsersController::class, 'index']);

// مسارات تتطلب مصادقة
Route::middleware('auth:sanctum')->group(function () {
    // طرق المصادقة
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', [LoginController::class, 'getUser']);

    // طرق لوحة التحكم
    Route::get('/dashboard/statistics', [DashboardController::class, 'getStatistics']);
    Route::get('/dashboard/absence-data', [DashboardController::class, 'getAbsenceData']);
    Route::get('/dashboard/tomorrow-exams', [DashboardController::class, 'getTomorrowExams']);
    Route::get('/dashboard/notifications', [DashboardController::class, 'getNotifications']);
    Route::get('/dashboard/quick-stats', [DashboardController::class, 'getQuickStats']);
    Route::get('/dashboard/check-distribution', [DashboardController::class, 'checkTodayDistribution']);

    // مسارات إدارة المستخدمين المحمية
    Route::prefix('users')->group(function () {
        Route::get('/', [UsersController::class, 'index']);           // GET /api/users
        Route::post('/', [UsersController::class, 'store']);          // POST /api/users
        Route::get('/stats', [UsersController::class, 'statistics']); // GET /api/users/stats
        Route::get('/search', [UsersController::class, 'search']);    // GET /api/users/search
        Route::get('/{id}', [UsersController::class, 'show']);        // GET /api/users/{id}
        Route::put('/{id}', [UsersController::class, 'update']);      // PUT /api/users/{id}
        Route::delete('/{id}', [UsersController::class, 'destroy']);  // DELETE /api/users/{id}

        // مسارات إضافية للمستخدمين
        Route::patch('/{id}/suspend', [UsersController::class, 'suspend']);    // PATCH /api/users/{id}/suspend
        Route::patch('/{id}/activate', [UsersController::class, 'activate']);  // PATCH /api/users/{id}/activate
        Route::patch('/bulk-status', [UsersController::class, 'bulkUpdateStatus']); // PATCH /api/users/bulk-status
    });
});


Route::get('/test-database', function () {
    try {
        // اختبار الاتصال الأساسي
        $pdo = DB::connection()->getPdo();
        $dbName = $pdo->query('SELECT current_database()')->fetchColumn();

        // اختبار وجود الجدول
        $tableExists = Schema::hasTable('public.users_s');

        // عد المستخدمين الحاليين
        $userCount = 0;
        if ($tableExists) {
            $userCount = DB::table('public.users_s')->count();
        }

        // جلب تفاصيل الجدول
        $columns = [];
        if ($tableExists) {
            $columns = DB::select("
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'users_s'
                AND table_schema = 'public'
                ORDER BY ordinal_position
            ");
        }

        return response()->json([
            'status' => true,
            'message' => '✅ اتصال قاعدة البيانات ناجح',
            'database_info' => [
                'connection' => DB::connection()->getName(),
                'database_name' => $dbName,
                'driver' => DB::connection()->getDriverName(),
            ],
            'table_info' => [
                'exists' => $tableExists,
                'user_count' => $userCount,
                'columns' => $columns
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => '❌ فشل اختبار قاعدة البيانات',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});


// مسارات غير محمية للاختبار
Route::get('/test-rooms-list', [RoomsController::class, 'index']);
Route::get('/test-buildings', [RoomsController::class, 'getBuildings']);
Route::get('/test-floors/{buildingId}', [RoomsController::class, 'getFloors']);

// مسارات محمية
Route::middleware('auth:sanctum')->group(function () {
    // مسارات إدارة القاعات
    Route::prefix('rooms')->group(function () {
        Route::get('/', [RoomsController::class, 'index']);              // GET /api/rooms
        Route::post('/', [RoomsController::class, 'store']);             // POST /api/rooms
        Route::get('/stats', [RoomsController::class, 'statistics']);    // GET /api/rooms/stats
        Route::get('/{id}', [RoomsController::class, 'show']);           // GET /api/rooms/{id}
        Route::put('/{id}', [RoomsController::class, 'update']);         // PUT /api/rooms/{id}
        Route::delete('/{id}', [RoomsController::class, 'destroy']);     // DELETE /api/rooms/{id}
        Route::patch('/{id}/toggle-status', [RoomsController::class, 'toggleStatus']); // PATCH /api/rooms/{id}/toggle-status
    });

    // مسارات المباني والأدوار
    Route::prefix('buildings')->group(function () {
        Route::get('/', [RoomsController::class, 'getBuildings']);       // GET /api/buildings
        Route::get('/{id}/floors', [RoomsController::class, 'getFloors']); // GET /api/buildings/{id}/floors
    });
});

Route::middleware('auth:sanctum')->group(function () {

    // مسارات جداول الامتحانات
    Route::prefix('exam-schedules')->group(function () {
        Route::get('/', [ExamScheduleController::class, 'index']);                    // GET /api/exam-schedules
        Route::post('/', [ExamScheduleController::class, 'store']);                   // POST /api/exam-schedules
        Route::get('/statistics', [ExamScheduleController::class, 'getStatistics']); // GET /api/exam-schedules/statistics
        Route::get('/available-rooms', [ExamScheduleController::class, 'getAvailableRooms']); // GET /api/exam-schedules/available-rooms
        Route::get('/{id}', [ExamScheduleController::class, 'show']);                 // GET /api/exam-schedules/{id}
        Route::put('/{id}', [ExamScheduleController::class, 'update']);               // PUT /api/exam-schedules/{id}
        Route::delete('/{id}', [ExamScheduleController::class, 'destroy']);          // DELETE /api/exam-schedules/{id}
    });
});

// للاختبار - مسارات غير محمية (يمكن حذفها لاحقاً)
Route::prefix('test-exam-schedules')->group(function () {
    Route::get('/', [ExamScheduleController::class, 'index']);
    Route::post('/', [ExamScheduleController::class, 'store']);
    Route::get('/available-rooms', [ExamScheduleController::class, 'getAvailableRooms']);
});


// مسارات التوزيع اليومي - محمية بالمصادقة
Route::middleware('auth:sanctum')->group(function () {

    // مسارات التوزيع اليومي
    Route::prefix('daily-assignments')->group(function () {
        // تنفيذ التوزيع التلقائي
        Route::post('/automatic', [DailyAssignmentController::class, 'performAutomaticAssignment']);

        // الحصول على التوزيع حسب التاريخ والفترة
        Route::get('/by-date', [DailyAssignmentController::class, 'getAssignmentByDate']);

        // حفظ التوزيع النهائي
        Route::post('/save', [DailyAssignmentController::class, 'saveAssignment']);

        // حذف التوزيع
        Route::delete('/delete', [DailyAssignmentController::class, 'deleteAssignment']);

        // استبدال مشرف أو ملاحظ
        Route::post('/replace-user', [DailyAssignmentController::class, 'replaceUser']);

        // تسجيل غياب
        Route::post('/record-absence', [DailyAssignmentController::class, 'recordAbsence']);

        // الحصول على المتاحين للاستبدال
        Route::get('/available-for-replacement', [DailyAssignmentController::class, 'getAvailableForReplacement']);
    });
});

// للاختبار - مسارات غير محمية (يمكن حذفها لاحقاً)
Route::prefix('test-daily-assignments')->group(function () {
    Route::post('/automatic', [DailyAssignmentController::class, 'performAutomaticAssignment']);
    Route::get('/by-date', [DailyAssignmentController::class, 'getAssignmentByDate']);
});

// مسارات إدارة الغياب والاستبدال - محمية بالمصادقة
Route::middleware('auth:sanctum')->group(function () {

    // مسارات إدارة الغياب والاستبدال
    Route::prefix('absence-management')->group(function () {
        // الحصول على التوزيعات لتاريخ وفترة محددة
        Route::get('/assignments', [AbsenceReplacementController::class, 'getAssignments']);

        // تسجيل غياب
        Route::post('/record-absence', [AbsenceReplacementController::class, 'recordAbsence']);

        // الاستبدال التلقائي
        Route::post('/auto-replace', [AbsenceReplacementController::class, 'autoReplace']);

        // الحصول على المتاحين للاستبدال اليدوي
        Route::get('/available-replacements', [AbsenceReplacementController::class, 'getAvailableReplacements']);

        // الاستبدال اليدوي
        Route::post('/manual-replace', [AbsenceReplacementController::class, 'manualReplace']);
    });
});

// للاختبار - مسارات غير محمية (يمكن حذفها لاحقاً)
Route::prefix('test-absence')->group(function () {
    Route::get('/assignments', [AbsenceReplacementController::class, 'getAssignments']);
    Route::post('/record-absence', [AbsenceReplacementController::class, 'recordAbsence']);
    Route::post('/auto-replace', [AbsenceReplacementController::class, 'autoReplace']);
    Route::get('/available-replacements', [AbsenceReplacementController::class, 'getAvailableReplacements']);
    Route::post('/manual-replace', [AbsenceReplacementController::class, 'manualReplace']);
});
