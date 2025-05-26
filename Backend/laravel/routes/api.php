<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\UsersController;

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

// مسارات المصادقة (لا تتطلب رمز مصادقة)
Route::post('/login', [LoginController::class, 'login']);

// مسارات تتطلب مصادقة
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', [LoginController::class, 'getUser']);
});

// إضافة هذه الطرق بعد طرق المصادقة الموجودة
Route::middleware('auth:sanctum')->group(function () {
    // طرق المصادقة الموجودة
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', [LoginController::class, 'getUser']);

    // طرق لوحة التحكم الجديدة
    Route::get('/dashboard/statistics', [App\Http\Controllers\API\DashboardController::class, 'getStatistics']);
    Route::get('/dashboard/absence-data', [App\Http\Controllers\API\DashboardController::class, 'getAbsenceData']);
    Route::get('/dashboard/tomorrow-exams', [App\Http\Controllers\API\DashboardController::class, 'getTomorrowExams']);
    Route::get('/dashboard/notifications', [App\Http\Controllers\API\DashboardController::class, 'getNotifications']);
    Route::get('/dashboard/quick-stats', [App\Http\Controllers\API\DashboardController::class, 'getQuickStats']);
    Route::get('/dashboard/check-distribution', [App\Http\Controllers\API\DashboardController::class, 'checkTodayDistribution']);
});

// إضافة بعد الكود الموجود
Route::middleware('auth:sanctum')->group(function () {
    // ... الكود الموجود ...

    // مسارات إدارة المشرفين والملاحظين
    // مسارات المصادقة
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', [LoginController::class, 'getUser']);

    // مسارات إدارة المستخدمين
    Route::prefix('users')->group(function () {
        Route::get('/', [UsersController::class, 'index']);           // GET /api/users
        Route::post('/', [UsersController::class, 'store']);          // POST /api/users
        Route::get('/{id}', [UsersController::class, 'show']);        // GET /api/users/{id}
        Route::put('/{id}', [UsersController::class, 'update']);      // PUT /api/users/{id}
        Route::delete('/{id}', [UsersController::class, 'destroy']);  // DELETE /api/users/{id}

        // مسارات إضافية للمستخدمين
        Route::patch('/{id}/suspend', [UsersController::class, 'suspend']);    // PATCH /api/users/{id}/suspend
        Route::patch('/{id}/activate', [UsersController::class, 'activate']);  // PATCH /api/users/{id}/activate
        Route::get('/search', [UsersController::class, 'search']);             // GET /api/users/search
        Route::get('/stats', [UsersController::class, 'stats']);               // GET /api/users/stats
        Route::patch('/bulk-status', [UsersController::class, 'bulkUpdateStatus']); // PATCH /api/users/bulk-status
    });
});
