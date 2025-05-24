<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\LoginController;

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
