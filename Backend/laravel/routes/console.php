<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

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
