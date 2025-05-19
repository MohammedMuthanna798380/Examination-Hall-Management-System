<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\UserA;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
        try {
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

            // إنشاء رمز الوصول باستخدام Sanctum
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
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'خطأ في البيانات المدخلة',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            // تسجيل الخطأ للتشخيص
            // \Log::error('Login error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تسجيل الدخول',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * تسجيل خروج المستخدم
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            // حذف جميع رموز المستخدم
            $request->user()->tokens()->delete();

            return response()->json([
                'status' => true,
                'message' => 'تم تسجيل الخروج بنجاح'
            ]);
        } catch (\Exception $e) {
            // \Log::error('Logout error: ' . $e->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تسجيل الخروج',
            ], 500);
        }
    }

    /**
     * الحصول على بيانات المستخدم الحالي
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUser(Request $request)
    {
        try {
            return response()->json([
                'status' => true,
                'user' => [
                    'id' => $request->user()->id,
                    'username' => $request->user()->username,
                    'role' => $request->user()->role,
                ]
            ]);
        } catch (\Exception $e) {
            // \Log::error('Get user error: ' . $e->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب بيانات المستخدم',
            ], 500);
        }
    }
}
