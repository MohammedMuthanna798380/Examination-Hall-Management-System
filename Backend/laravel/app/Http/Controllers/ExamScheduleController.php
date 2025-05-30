<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ExamSchedule;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ExamScheduleController extends Controller
{
    /**
     * عرض قائمة جداول الامتحانات
     */
    public function index(Request $request)
    {
        try {
            Log::info('=== جلب قائمة جداول الامتحانات ===');

            $query = ExamSchedule::with(['rooms.floor.building']);

            // تطبيق الفلاتر
            if ($request->filled('date')) {
                $query->where('date', $request->date);
                Log::info('فلتر التاريخ: ' . $request->date);
            }

            if ($request->filled('period')) {
                $query->where('period', $request->period);
                Log::info('فلتر الفترة: ' . $request->period);
            }

            if ($request->filled('status')) {
                $query->where('distribution_status', $request->status);
                Log::info('فلتر الحالة: ' . $request->status);
            }

            // البحث في الغرف
            if ($request->filled('search')) {
                $search = $request->search;
                $query->whereHas('rooms', function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhereHas('floor.building', function ($sq) use ($search) {
                            $sq->where('name', 'LIKE', "%{$search}%");
                        });
                });
                Log::info('البحث: ' . $search);
            }

            $examSchedules = $query->orderBy('date', 'desc')
                ->orderBy('period', 'desc')
                ->get();

            // تنسيق البيانات للإرسال
            $formattedSchedules = $examSchedules->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'date' => $schedule->date->format('Y-m-d'),
                    'period' => $schedule->period,
                    'distribution_status' => $schedule->distribution_status,
                    'rooms' => $schedule->rooms->pluck('id')->toArray(),
                    'rooms_data' => $schedule->getRoomsWithDetails(),
                    'created_at' => $schedule->created_at->format('Y-m-d'),
                    'requirements' => $schedule->getTotalRequirements(),
                ];
            });

            Log::info('تم جلب ' . $formattedSchedules->count() . ' جدول امتحان');

            return response()->json([
                'status' => true,
                'data' => $formattedSchedules
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب جداول الامتحانات: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب البيانات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * إنشاء جدول امتحان جديد
     */
    public function store(Request $request)
    {
        try {
            Log::info('=== إنشاء جدول امتحان جديد ===');
            Log::info('البيانات الواردة: ', $request->all());

            // التحقق من صحة البيانات
            $validator = Validator::make($request->all(), [
                'date' => 'required|date|after_or_equal:today',
                'period' => 'required|in:morning,evening',
                'rooms' => 'required|array|min:1',
                'rooms.*' => 'exists:public.rooms,id',
            ], [
                'date.required' => 'التاريخ مطلوب',
                'date.date' => 'تنسيق التاريخ غير صحيح',
                'date.after_or_equal' => 'لا يمكن إنشاء جدول امتحان لتاريخ ماضي',
                'period.required' => 'الفترة مطلوبة',
                'period.in' => 'الفترة يجب أن تكون صباحية أو مسائية',
                'rooms.required' => 'اختيار القاعات مطلوب',
                'rooms.min' => 'يجب اختيار قاعة واحدة على الأقل',
                'rooms.*.exists' => 'إحدى القاعات المختارة غير موجودة',
            ]);

            if ($validator->fails()) {
                Log::warning('فشل التحقق من صحة البيانات: ', $validator->errors()->toArray());
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // التحقق من عدم وجود جدول بنفس التاريخ والفترة
            $existingSchedule = ExamSchedule::where('date', $request->date)
                ->where('period', $request->period)
                ->first();

            if ($existingSchedule) {
                return response()->json([
                    'status' => false,
                    'message' => 'يوجد جدول امتحان بالفعل لنفس التاريخ والفترة'
                ], 422);
            }

            // التحقق من أن جميع القاعات متاحة
            $unavailableRooms = Room::whereIn('id', $request->rooms)
                ->where('status', '!=', 'available')
                ->pluck('name')
                ->toArray();

            if (!empty($unavailableRooms)) {
                return response()->json([
                    'status' => false,
                    'message' => 'القاعات التالية غير متاحة: ' . implode(', ', $unavailableRooms)
                ], 422);
            }

            DB::beginTransaction();

            try {
                // إنشاء جدول الامتحان
                $examSchedule = ExamSchedule::create([
                    'date' => $request->date,
                    'period' => $request->period,
                    'distribution_status' => 'incomplete',
                ]);

                // ربط القاعات
                $examSchedule->rooms()->attach($request->rooms);

                DB::commit();

                // جلب البيانات الكاملة
                $examSchedule->load('rooms.floor.building');

                $formattedSchedule = [
                    'id' => $examSchedule->id,
                    'date' => $examSchedule->date->format('Y-m-d'),
                    'period' => $examSchedule->period,
                    'distribution_status' => $examSchedule->distribution_status,
                    'rooms' => $examSchedule->rooms->pluck('id')->toArray(),
                    'rooms_data' => $examSchedule->getRoomsWithDetails(),
                    'created_at' => $examSchedule->created_at->format('Y-m-d'),
                    'requirements' => $examSchedule->getTotalRequirements(),
                ];

                Log::info('تم إنشاء جدول الامتحان بنجاح: ' . $examSchedule->id);

                return response()->json([
                    'status' => true,
                    'message' => 'تم إنشاء جدول الامتحان بنجاح',
                    'data' => $formattedSchedule
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في إنشاء جدول الامتحان: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء إنشاء جدول الامتحان',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * عرض جدول امتحان محدد
     */
    public function show($id)
    {
        try {
            $examSchedule = ExamSchedule::with(['rooms.floor.building'])->findOrFail($id);

            $formattedSchedule = [
                'id' => $examSchedule->id,
                'date' => $examSchedule->date->format('Y-m-d'),
                'period' => $examSchedule->period,
                'distribution_status' => $examSchedule->distribution_status,
                'rooms' => $examSchedule->rooms->pluck('id')->toArray(),
                'rooms_data' => $examSchedule->getRoomsWithDetails(),
                'created_at' => $examSchedule->created_at->format('Y-m-d'),
                'requirements' => $examSchedule->getTotalRequirements(),
            ];

            return response()->json([
                'status' => true,
                'data' => $formattedSchedule
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب جدول الامتحان ' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'جدول الامتحان غير موجود'
            ], 404);
        }
    }

    /**
     * تحديث جدول امتحان
     */
    public function update(Request $request, $id)
    {
        try {
            Log::info('تحديث جدول الامتحان ' . $id . ' بالبيانات: ', $request->all());

            $examSchedule = ExamSchedule::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'date' => 'required|date|after_or_equal:today',
                'period' => 'required|in:morning,evening',
                'rooms' => 'required|array|min:1',
                'rooms.*' => 'exists:public.rooms,id',
            ], [
                'date.required' => 'التاريخ مطلوب',
                'date.date' => 'تنسيق التاريخ غير صحيح',
                'date.after_or_equal' => 'لا يمكن تحديث لتاريخ ماضي',
                'period.required' => 'الفترة مطلوبة',
                'period.in' => 'الفترة يجب أن تكون صباحية أو مسائية',
                'rooms.required' => 'اختيار القاعات مطلوب',
                'rooms.min' => 'يجب اختيار قاعة واحدة على الأقل',
                'rooms.*.exists' => 'إحدى القاعات المختارة غير موجودة',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // التحقق من عدم وجود جدول آخر بنفس التاريخ والفترة
            $existingSchedule = ExamSchedule::where('date', $request->date)
                ->where('period', $request->period)
                ->where('id', '!=', $id)
                ->first();

            if ($existingSchedule) {
                return response()->json([
                    'status' => false,
                    'message' => 'يوجد جدول امتحان آخر بالفعل لنفس التاريخ والفترة'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // تحديث البيانات الأساسية
                $examSchedule->update([
                    'date' => $request->date,
                    'period' => $request->period,
                    'distribution_status' => 'incomplete', // إعادة تعيين حالة التوزيع
                ]);

                // تحديث القاعات
                $examSchedule->rooms()->sync($request->rooms);

                DB::commit();

                // جلب البيانات المحدثة
                $examSchedule->load('rooms.floor.building');

                $formattedSchedule = [
                    'id' => $examSchedule->id,
                    'date' => $examSchedule->date->format('Y-m-d'),
                    'period' => $examSchedule->period,
                    'distribution_status' => $examSchedule->distribution_status,
                    'rooms' => $examSchedule->rooms->pluck('id')->toArray(),
                    'rooms_data' => $examSchedule->getRoomsWithDetails(),
                    'created_at' => $examSchedule->created_at->format('Y-m-d'),
                    'requirements' => $examSchedule->getTotalRequirements(),
                ];

                Log::info('تم تحديث جدول الامتحان بنجاح: ' . $examSchedule->id);

                return response()->json([
                    'status' => true,
                    'message' => 'تم تحديث جدول الامتحان بنجاح',
                    'data' => $formattedSchedule
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في تحديث جدول الامتحان: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تحديث جدول الامتحان',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * حذف جدول امتحان
     */
    public function destroy($id)
    {
        try {
            $examSchedule = ExamSchedule::findOrFail($id);

            // التحقق من عدم وجود توزيعات مرتبطة
            $hasAssignments = $examSchedule->assignments()->exists();

            if ($hasAssignments) {
                return response()->json([
                    'status' => false,
                    'message' => 'لا يمكن حذف جدول الامتحان لأنه يحتوي على توزيعات مرتبطة'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // حذف العلاقات مع القاعات
                $examSchedule->rooms()->detach();

                // حذف جدول الامتحان
                $examSchedule->delete();

                DB::commit();

                Log::info('تم حذف جدول الامتحان بنجاح: ' . $id);

                return response()->json([
                    'status' => true,
                    'message' => 'تم حذف جدول الامتحان بنجاح'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في حذف جدول الامتحان: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء حذف جدول الامتحان',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * الحصول على القاعات المتاحة
     */
    public function getAvailableRooms()
    {
        try {
            $rooms = Room::with(['floor.building'])
                ->where('status', 'available')
                ->orderBy('name')
                ->get();

            $formattedRooms = $rooms->map(function ($room) {
                return [
                    'id' => $room->id,
                    'name' => $room->name,
                    'building_name' => $room->floor->building->name,
                    'floor_name' => $room->floor->name,
                    'capacity' => $room->capacity,
                    'required_supervisors' => $room->required_supervisors,
                    'required_observers' => $room->required_observers,
                    'can_add_observer' => $room->can_add_observer,
                    'status' => $room->status,
                ];
            });

            return response()->json([
                'status' => true,
                'data' => $formattedRooms
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب القاعات المتاحة: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب القاعات المتاحة',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * الحصول على إحصائيات جداول الامتحانات
     */
    public function getStatistics()
    {
        try {
            $today = Carbon::today();

            $stats = [
                'total_schedules' => ExamSchedule::count(),
                'today_schedules' => ExamSchedule::where('date', $today)->count(),
                'complete_distributions' => ExamSchedule::where('distribution_status', 'complete')->count(),
                'incomplete_distributions' => ExamSchedule::whereIn('distribution_status', ['incomplete', 'partial'])->count(),
                'upcoming_schedules' => ExamSchedule::where('date', '>', $today)->count(),
            ];

            return response()->json([
                'status' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب إحصائيات جداول الامتحانات: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب الإحصائيات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }
}
