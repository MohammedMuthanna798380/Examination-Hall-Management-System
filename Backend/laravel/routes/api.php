<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\UsersController;
use App\Http\Controllers\API\DashboardController;

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

Route::post('/login', [LoginController::class, 'login']);

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

    // مسارات إدارة المستخدمين
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
