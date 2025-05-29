<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Users_s;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class UsersController extends Controller
{
    /**
     * عرض قائمة المشرفين والملاحظين
     */
    public function index(Request $request)
    {
        try {
            Log::info('=== بداية جلب قائمة المستخدمين ===');

            $query = Users_s::query();

            // تطبيق الفلاتر
            if ($request->filled('type')) {
                $query->where('type', $request->type);
                Log::info('تطبيق فلتر النوع: ' . $request->type);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
                Log::info('تطبيق فلتر الحالة: ' . $request->status);
            }

            if ($request->filled('rank')) {
                $query->where('rank', $request->rank);
                Log::info('تطبيق فلتر الرتبة: ' . $request->rank);
            }

            // البحث
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('specialization', 'LIKE', "%{$search}%")
                        ->orWhere('phone', 'LIKE', "%{$search}%");
                });
                Log::info('تطبيق البحث: ' . $search);
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            Log::info('تم جلب ' . $users->count() . ' مستخدم بنجاح');

            return response()->json([
                'status' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب المستخدمين: ' . $e->getMessage());
            Log::error('ملف الخطأ: ' . $e->getFile() . ' السطر: ' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب البيانات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * إضافة مشرف/ملاحظ جديد
     */
    public function store(Request $request)
    {
        Log::info('=== بداية إنشاء مستخدم جديد ===');

        try {
            // 1. تسجيل البيانات الواردة
            Log::info('البيانات الواردة: ', $request->all());
            Log::info('طريقة الطلب: ' . $request->method());
            Log::info('Content-Type: ' . $request->header('Content-Type'));

            // 2. التحقق من اتصال قاعدة البيانات
            try {
                $pdo = DB::connection()->getPdo();
                Log::info('✅ اتصال قاعدة البيانات ناجح');
                Log::info('نوع قاعدة البيانات: ' . DB::connection()->getDriverName());
            } catch (\Exception $e) {
                Log::error('❌ فشل اتصال قاعدة البيانات: ' . $e->getMessage());
                throw new \Exception('فشل في الاتصال بقاعدة البيانات: ' . $e->getMessage());
            }

            // 3. التحقق من وجود الجدول
            try {
                $tableExists = Schema::hasTable('public.users_s');
                if (!$tableExists) {
                    Log::error('❌ جدول public.users_s غير موجود');
                    throw new \Exception('جدول المستخدمين غير موجود');
                }
                Log::info('✅ جدول public.users_s موجود');

                // جلب تفاصيل الجدول
                $columns = DB::select("SELECT column_name, data_type, is_nullable
                                     FROM information_schema.columns
                                     WHERE table_name = 'users_s'
                                     AND table_schema = 'public'
                                     ORDER BY ordinal_position");

                Log::info('أعمدة الجدول: ', array_map(function ($col) {
                    return $col->column_name . ' (' . $col->data_type . ')';
                }, $columns));
            } catch (\Exception $e) {
                Log::error('❌ خطأ في التحقق من الجدول: ' . $e->getMessage());
                throw new \Exception('خطأ في التحقق من جدول البيانات: ' . $e->getMessage());
            }

            // 4. التحقق من صحة البيانات
            Log::info('بداية التحقق من صحة البيانات');

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'specialization' => 'required|string|max:255',
                'phone' => 'required|string|regex:/^[0-9]{9,10}$/|unique:public.users_s,phone',
                'whatsapp' => 'required|string|regex:/^[0-9]{9,10}$/',
                'type' => 'required|in:supervisor,observer',
                'rank' => 'required|in:college_employee,external_employee',
            ], [
                'name.required' => 'الاسم مطلوب',
                'name.max' => 'الاسم طويل جداً',
                'specialization.required' => 'التخصص مطلوب',
                'specialization.max' => 'التخصص طويل جداً',
                'phone.required' => 'رقم الهاتف مطلوب',
                'phone.regex' => 'رقم الهاتف يجب أن يكون 9-10 أرقام',
                'phone.unique' => 'رقم الهاتف مستخدم من قبل',
                'whatsapp.required' => 'رقم الواتساب مطلوب',
                'whatsapp.regex' => 'رقم الواتساب يجب أن يكون 9-10 أرقام',
                'type.required' => 'نوع المستخدم مطلوب',
                'type.in' => 'نوع المستخدم يجب أن يكون مشرف أو ملاحظ',
                'rank.required' => 'رتبة المستخدم مطلوبة',
                'rank.in' => 'رتبة المستخدم يجب أن تكون موظف كلية أو موظف خارجي',
            ]);

            if ($validator->fails()) {
                Log::warning('فشل التحقق من صحة البيانات: ', $validator->errors()->toArray());
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('✅ التحقق من صحة البيانات نجح');

            // 5. تحضير البيانات للإدخال
            $userData = [
                'name' => trim($request->name),
                'specialization' => trim($request->specialization),
                'phone' => trim($request->phone),
                'whatsapp' => trim($request->whatsapp),
                'type' => $request->type,
                'rank' => $request->rank,
                'status' => 'active',
                'consecutive_absence_days' => 0,
                'last_absence_date' => null
            ];

            Log::info('البيانات المحضرة للإدخال: ', $userData);

            // 6. محاولة إنشاء المستخدم
            Log::info('محاولة إنشاء المستخدم باستخدام Eloquent');

            $user = Users_s::create($userData);

            Log::info('✅ تم إنشاء المستخدم بنجاح برقم: ' . $user->id);

            return response()->json([
                'status' => true,
                'message' => 'تم إضافة المستخدم بنجاح',
                'data' => $user
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('❌ خطأ في قاعدة البيانات: ' . $e->getMessage());
            Log::error('SQL Error Code: ' . $e->getCode());
            Log::error('SQL State: ' . $e->errorInfo[0] ?? 'غير محدد');

            // التحقق من نوع خطأ قاعدة البيانات
            if (str_contains($e->getMessage(), 'duplicate key') || str_contains($e->getMessage(), 'UNIQUE constraint')) {
                return response()->json([
                    'status' => false,
                    'message' => 'رقم الهاتف مستخدم بالفعل'
                ], 422);
            }

            return response()->json([
                'status' => false,
                'message' => 'خطأ في قاعدة البيانات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في حفظ البيانات'
            ], 500);
        } catch (\Exception $e) {
            Log::error('❌ خطأ عام في إنشاء المستخدم: ' . $e->getMessage());
            Log::error('نوع الخطأ: ' . get_class($e));
            Log::error('ملف الخطأ: ' . $e->getFile() . ' السطر: ' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء إضافة المستخدم',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم',
                'debug_info' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'class' => get_class($e)
                ] : null
            ], 500);
        }
    }

    /**
     * عرض مستخدم محدد
     */
    public function show($id)
    {
        try {
            Log::info('جلب المستخدم: ' . $id);
            $user = Users_s::findOrFail($id);

            return response()->json([
                'status' => true,
                'data' => $user
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب المستخدم ' . $id . ': ' . $e->getMessage());
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
            Log::info('تحديث المستخدم ' . $id . ' بالبيانات: ', $request->all());

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
                'name.max' => 'الاسم طويل جداً',
                'specialization.required' => 'التخصص مطلوب',
                'specialization.max' => 'التخصص طويل جداً',
                'phone.required' => 'رقم الهاتف مطلوب',
                'phone.regex' => 'رقم الهاتف يجب أن يكون 9-10 أرقام',
                'phone.unique' => 'رقم الهاتف مستخدم من قبل',
                'whatsapp.required' => 'رقم الواتساب مطلوب',
                'whatsapp.regex' => 'رقم الواتساب يجب أن يكون 9-10 أرقام',
            ]);

            if ($validator->fails()) {
                Log::warning('فشل التحقق من صحة البيانات في التحديث: ', $validator->errors()->toArray());
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'name' => trim($request->name),
                'specialization' => trim($request->specialization),
                'phone' => trim($request->phone),
                'whatsapp' => trim($request->whatsapp),
                'type' => $request->type,
                'rank' => $request->rank,
            ];

            // إضافة الحالة إذا تم إرسالها
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }

            $user->update($updateData);

            Log::info('تم تحديث المستخدم بنجاح: ' . $user->id);

            return response()->json([
                'status' => true,
                'message' => 'تم تحديث بيانات المستخدم بنجاح',
                'data' => $user->fresh()
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('خطأ قاعدة بيانات في تحديث المستخدم: ' . $e->getMessage());

            if (str_contains($e->getMessage(), 'duplicate key') || str_contains($e->getMessage(), 'UNIQUE constraint')) {
                return response()->json([
                    'status' => false,
                    'message' => 'رقم الهاتف مستخدم بالفعل'
                ], 422);
            }

            return response()->json([
                'status' => false,
                'message' => 'خطأ في قاعدة البيانات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في تحديث البيانات'
            ], 500);
        } catch (\Exception $e) {
            Log::error('خطأ عام في تحديث المستخدم: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تحديث بيانات المستخدم',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
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
            Log::info('تم حذف المستخدم بنجاح: ' . $user->id);

            return response()->json([
                'status' => true,
                'message' => 'تم حذف المستخدم بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في حذف المستخدم ' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء حذف المستخدم',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
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
            Log::info('تم تعليق المستخدم بنجاح: ' . $user->id);

            return response()->json([
                'status' => true,
                'message' => 'تم تعليق المستخدم بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تعليق المستخدم ' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تعليق المستخدم',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
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
            Log::info('تم تنشيط المستخدم بنجاح: ' . $user->id);

            return response()->json([
                'status' => true,
                'message' => 'تم تنشيط المستخدم بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تنشيط المستخدم ' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تنشيط المستخدم',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * البحث في المستخدمين
     */
    public function search(Request $request)
    {
        try {
            $query = $request->get('q', '');

            $users = Users_s::where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                    ->orWhere('specialization', 'LIKE', "%{$query}%")
                    ->orWhere('phone', 'LIKE', "%{$query}%");
            })
                ->where('status', '!=', 'deleted')
                ->limit(20)
                ->get();

            return response()->json([
                'status' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في البحث: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء البحث',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
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
            Log::error('خطأ في الإحصائيات: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب الإحصائيات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تحديث حالة عدة مستخدمين
     */
    public function bulkUpdateStatus(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'userIds' => 'required|array',
                'userIds.*' => 'exists:public.users_s,id',
                'status' => 'required|in:active,suspended,deleted',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            Users_s::whereIn('id', $request->userIds)
                ->update(['status' => $request->status]);

            Log::info('تم تحديث حالة مجموعية للمستخدمين: ' . implode(',', $request->userIds));

            return response()->json([
                'status' => true,
                'message' => 'تم تحديث حالة المستخدمين بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في التحديث المجموعي: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تحديث حالة المستخدمين',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }
}
