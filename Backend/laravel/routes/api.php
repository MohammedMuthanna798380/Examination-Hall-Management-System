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
