<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\UserA;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    /**
     * تسجيل دخول المستخدم
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        // dd($request->all());
        // التحقق من صحة البيانات
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ], [
            'username.required' => 'اسم المستخدم مطلوب',
            'password.required' => 'كلمة المرور مطلوبة',
        ]);

        // البحث عن المستخدم في قاعدة البيانات
        $user = UserA::where('username', $request->username)->first();

        // التحقق من وجود المستخدم وصحة كلمة المرور
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => false,
                'message' => 'بيانات تسجيل الدخول غير صحيحة'
            ], 401);
        }

        // التحقق من حالة المستخدم
        if (!$user->active) {
            return response()->json([
                'status' => false,
                'message' => 'الحساب معطل، يرجى التواصل مع المسؤول'
            ], 403);
        }

        // إنشاء رمز الوصول
        $token = $user->createToken('auth_token')->plainTextToken;

        // إرجاع الاستجابة
        return response()->json([
            'status' => true,
            'message' => 'تم تسجيل الدخول بنجاح',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
            ],
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * تسجيل خروج المستخدم
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // حذف جميع رموز المستخدم
        $request->user()->tokens()->delete();

        return response()->json([
            'status' => true,
            'message' => 'تم تسجيل الخروج بنجاح'
        ]);
    }

    /**
     * الحصول على بيانات المستخدم الحالي
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUser(Request $request)
    {
        return response()->json([
            'status' => true,
            'user' => [
                'id' => $request->user()->id,
                'username' => $request->user()->username,
                'role' => $request->user()->role,
            ]
        ]);
    }
}
