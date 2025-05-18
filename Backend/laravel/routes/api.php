<?php
/*use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\LoginController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// مسارات المصادقة (لا تتطلب رمز مصادقة)
/*Route::post('/login', [LoginController::class, 'login']);

// مسارات تتطلب مصادقة
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', [LoginController::class, 'getUser']);
});


Route::get('/check-connection', function () {
    return response()->json(['message' => 'Laravel is connected']);
});
*/

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', function (Request $request) {
    return response()->json([
        'email' => $request->email,
        'password' => $request->password,
        'message' => 'تم استقبال البيانات من React'
    ]);
});

Route::get('/check-connection', function () {
    return response()->json(['message' => 'Laravel is connected']);
});
