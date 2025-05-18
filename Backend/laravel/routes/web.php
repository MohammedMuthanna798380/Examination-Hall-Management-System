<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\LoginController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/check-connection', function () {
    return response()->json(['message' => 'Laravel is connected']);
});

// مسارات المصادقة (لا تتطلب رمز مصادقة)
// Route::get('/login', [LoginController::class, 'login']);

// // مسارات تتطلب مصادقة
// Route::middleware('auth:sanctum')->group(function () {
//     Route::post('/logout', [LoginController::class, 'logout']);
//     Route::get('/user', [LoginController::class, 'getUser']);
// });
