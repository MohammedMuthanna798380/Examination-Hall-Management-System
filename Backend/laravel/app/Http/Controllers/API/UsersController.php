<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Users_s;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UsersController extends Controller
{
    /**
     * عرض قائمة المشرفين والملاحظين
     */
    public function index(Request $request)
    {
        try {
            $query = Users_s::query();

            // تطبيق الفلاتر
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('rank')) {
                $query->where('rank', $request->rank);
            }

            // البحث
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('specialization', 'LIKE', "%{$search}%")
                        ->orWhere('phone', 'LIKE', "%{$search}%");
                });
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'status' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب البيانات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * إضافة مشرف/ملاحظ جديد
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'specialization' => 'required|string|max:255',
                'phone' => 'required|string|regex:/^[0-9]{9,10}$/|unique:public.users_s,phone',
                'whatsapp' => 'required|string|regex:/^[0-9]{9,10}$/',
                'type' => 'required|in:supervisor,observer',
                'rank' => 'required|in:college_employee,external_employee',
            ], [
                'name.required' => 'الاسم مطلوب',
                'specialization.required' => 'التخصص مطلوب',
                'phone.required' => 'رقم الهاتف مطلوب',
                'phone.regex' => 'رقم الهاتف غير صالح',
                'phone.unique' => 'رقم الهاتف مستخدم من قبل',
                'whatsapp.required' => 'رقم الواتساب مطلوب',
                'whatsapp.regex' => 'رقم الواتساب غير صالح',
                'type.required' => 'نوع المستخدم مطلوب',
                'type.in' => 'نوع المستخدم يجب أن يكون مشرف أو ملاحظ',
                'rank.required' => 'رتبة المستخدم مطلوبة',
                'rank.in' => 'رتبة المستخدم يجب أن تكون موظف كلية أو موظف خارجي',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Users_s::create([
                'name' => $request->name,
                'specialization' => $request->specialization,
                'phone' => $request->phone,
                'whatsapp' => $request->whatsapp,
                'type' => $request->type,
                'rank' => $request->rank,
                'status' => 'active',
                'consecutive_absence_days' => 0
            ]);

            return response()->json([
                'status' => true,
                'message' => 'تم إضافة المستخدم بنجاح',
                'data' => $user
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء إضافة المستخدم',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * عرض مستخدم محدد
     */
    public function show($id)
    {
        try {
            $user = Users_s::findOrFail($id);

            return response()->json([
                'status' => true,
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'المستخدم غير موجود'
            ], 404);
        }
    }

    /**
     * تحديث بيانات مستخدم
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Users_s::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'specialization' => 'required|string|max:255',
                'phone' => 'required|string|regex:/^[0-9]{9,10}$/|unique:public.users_s,phone,' . $id,
                'whatsapp' => 'required|string|regex:/^[0-9]{9,10}$/',
                'type' => 'required|in:supervisor,observer',
                'rank' => 'required|in:college_employee,external_employee',
                'status' => 'sometimes|in:active,suspended,deleted',
            ], [
                'name.required' => 'الاسم مطلوب',
                'specialization.required' => 'التخصص مطلوب',
                'phone.required' => 'رقم الهاتف مطلوب',
                'phone.regex' => 'رقم الهاتف غير صالح',
                'phone.unique' => 'رقم الهاتف مستخدم من قبل',
                'whatsapp.required' => 'رقم الواتساب مطلوب',
                'whatsapp.regex' => 'رقم الواتساب غير صالح',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user->update($request->only([
                'name',
                'specialization',
                'phone',
                'whatsapp',
                'type',
                'rank',
                'status'
            ]));

            return response()->json([
                'status' => true,
                'message' => 'تم تحديث بيانات المستخدم بنجاح',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تحديث بيانات المستخدم',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * حذف مستخدم (تغيير الحالة إلى محذوف)
     */
    public function destroy($id)
    {
        try {
            $user = Users_s::findOrFail($id);

            $user->update(['status' => 'deleted']);

            return response()->json([
                'status' => true,
                'message' => 'تم حذف المستخدم بنجاح'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء حذف المستخدم',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تعليق مستخدم
     */
    public function suspend($id)
    {
        try {
            $user = Users_s::findOrFail($id);

            $user->update(['status' => 'suspended']);

            return response()->json([
                'status' => true,
                'message' => 'تم تعليق المستخدم بنجاح'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تعليق المستخدم',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تنشيط مستخدم
     */
    public function activate($id)
    {
        try {
            $user = Users_s::findOrFail($id);

            $user->update([
                'status' => 'active',
                'consecutive_absence_days' => 0
            ]);

            return response()->json([
                'status' => true,
                'message' => 'تم تنشيط المستخدم بنجاح'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تنشيط المستخدم',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على إحصائيات المستخدمين
     */
    public function statistics()
    {
        try {
            $stats = [
                'total' => Users_s::where('status', '!=', 'deleted')->count(),
                'supervisors' => Users_s::where('type', 'supervisor')
                    ->where('status', '!=', 'deleted')->count(),
                'observers' => Users_s::where('type', 'observer')
                    ->where('status', '!=', 'deleted')->count(),
                'college_employees' => Users_s::where('rank', 'college_employee')
                    ->where('status', '!=', 'deleted')->count(),
                'external_employees' => Users_s::where('rank', 'external_employee')
                    ->where('status', '!=', 'deleted')->count(),
                'active' => Users_s::where('status', 'active')->count(),
                'suspended' => Users_s::where('status', 'suspended')->count(),
            ];

            return response()->json([
                'status' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب الإحصائيات',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
