<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Building;
use App\Models\Floor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoomsController extends Controller
{
    /**
     * عرض قائمة القاعات مع المباني والأدوار
     */
    public function index(Request $request)
    {
        try {
            Log::info('=== بداية جلب قائمة القاعات ===');

            $query = Room::with(['floor.building']);

            // تطبيق الفلاتر
            if ($request->filled('building_id')) {
                $query->whereHas('floor', function ($q) use ($request) {
                    $q->where('building_id', $request->building_id);
                });
                Log::info('تطبيق فلتر المبنى: ' . $request->building_id);
            }

            if ($request->filled('floor_id')) {
                $query->where('floor_id', $request->floor_id);
                Log::info('تطبيق فلتر الدور: ' . $request->floor_id);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
                Log::info('تطبيق فلتر الحالة: ' . $request->status);
            }

            // البحث
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%");
                });
                Log::info('تطبيق البحث: ' . $search);
            }

            $rooms = $query->orderBy('created_at', 'desc')->get();

            // تنسيق البيانات للعرض
            $formattedRooms = $rooms->map(function ($room) {
                return [
                    'id' => $room->id,
                    'name' => $room->name,
                    'floor_id' => $room->floor_id,
                    'building_id' => $room->floor->building_id,
                    'floor_name' => $room->floor->name,
                    'building_name' => $room->floor->building->name,
                    'capacity' => $room->capacity,
                    'required_supervisors' => $room->required_supervisors,
                    'required_observers' => $room->required_observers,
                    'can_add_observer' => $room->can_add_observer,
                    'status' => $room->status,
                    'created_at' => $room->created_at->format('Y-m-d'),
                ];
            });

            Log::info('تم جلب ' . $formattedRooms->count() . ' قاعة بنجاح');

            return response()->json([
                'status' => true,
                'data' => $formattedRooms
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب القاعات: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب البيانات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * عرض قائمة المباني
     */
    public function getBuildings()
    {
        try {
            $buildings = Building::orderBy('name')->get();

            return response()->json([
                'status' => true,
                'data' => $buildings
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب المباني: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب المباني',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * عرض قائمة الأدوار لمبنى معين
     */
    public function getFloors($buildingId)
    {
        try {
            $floors = Floor::where('building_id', $buildingId)
                ->orderBy('name')
                ->get();

            return response()->json([
                'status' => true,
                'data' => $floors
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب الأدوار: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب الأدوار',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * إضافة قاعة جديدة
     */
    public function store(Request $request)
    {
        Log::info('=== بداية إنشاء قاعة جديدة ===');

        try {
            Log::info('البيانات الواردة: ', $request->all());

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'floor_id' => 'required|exists:public.floors,id',
                'capacity' => 'required|integer|min:1|max:1000',
                'required_supervisors' => 'required|integer|min:1|max:10',
                'required_observers' => 'required|integer|min:1|max:20',
                'can_add_observer' => 'boolean',
            ], [
                'name.required' => 'اسم القاعة مطلوب',
                'name.max' => 'اسم القاعة طويل جداً',
                'floor_id.required' => 'الدور مطلوب',
                'floor_id.exists' => 'الدور المحدد غير موجود',
                'capacity.required' => 'السعة مطلوبة',
                'capacity.integer' => 'السعة يجب أن تكون رقماً صحيحاً',
                'capacity.min' => 'السعة يجب أن تكون أكبر من صفر',
                'capacity.max' => 'السعة كبيرة جداً',
                'required_supervisors.required' => 'عدد المشرفين المطلوبين مطلوب',
                'required_supervisors.integer' => 'عدد المشرفين يجب أن يكون رقماً صحيحاً',
                'required_supervisors.min' => 'يجب أن يكون هناك مشرف واحد على الأقل',
                'required_observers.required' => 'عدد الملاحظين المطلوبين مطلوب',
                'required_observers.integer' => 'عدد الملاحظين يجب أن يكون رقماً صحيحاً',
                'required_observers.min' => 'يجب أن يكون هناك ملاحظ واحد على الأقل',
            ]);

            if ($validator->fails()) {
                Log::warning('فشل التحقق من صحة البيانات: ', $validator->errors()->toArray());
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // التحقق من عدم تكرار اسم القاعة في نفس الدور
            $existingRoom = Room::where('name', $request->name)
                ->where('floor_id', $request->floor_id)
                ->first();

            if ($existingRoom) {
                return response()->json([
                    'status' => false,
                    'message' => 'يوجد قاعة بنفس الاسم في هذا الدور'
                ], 422);
            }

            $roomData = [
                'name' => trim($request->name),
                'floor_id' => $request->floor_id,
                'capacity' => $request->capacity,
                'required_supervisors' => $request->required_supervisors,
                'required_observers' => $request->required_observers,
                'can_add_observer' => $request->boolean('can_add_observer', false),
                'status' => 'available'
            ];

            Log::info('البيانات المحضرة للإدخال: ', $roomData);

            $room = Room::create($roomData);

            // جلب القاعة مع العلاقات
            $room = Room::with(['floor.building'])->find($room->id);

            // تنسيق البيانات للإرسال
            $formattedRoom = [
                'id' => $room->id,
                'name' => $room->name,
                'floor_id' => $room->floor_id,
                'building_id' => $room->floor->building_id,
                'floor_name' => $room->floor->name,
                'building_name' => $room->floor->building->name,
                'capacity' => $room->capacity,
                'required_supervisors' => $room->required_supervisors,
                'required_observers' => $room->required_observers,
                'can_add_observer' => $room->can_add_observer,
                'status' => $room->status,
                'created_at' => $room->created_at->format('Y-m-d'),
            ];

            Log::info('✅ تم إنشاء القاعة بنجاح برقم: ' . $room->id);

            return response()->json([
                'status' => true,
                'message' => 'تم إضافة القاعة بنجاح',
                'data' => $formattedRoom
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌ خطأ عام في إنشاء القاعة: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء إضافة القاعة',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * عرض قاعة محددة
     */
    public function show($id)
    {
        try {
            Log::info('جلب القاعة: ' . $id);
            $room = Room::with(['floor.building'])->findOrFail($id);

            $formattedRoom = [
                'id' => $room->id,
                'name' => $room->name,
                'floor_id' => $room->floor_id,
                'building_id' => $room->floor->building_id,
                'floor_name' => $room->floor->name,
                'building_name' => $room->floor->building->name,
                'capacity' => $room->capacity,
                'required_supervisors' => $room->required_supervisors,
                'required_observers' => $room->required_observers,
                'can_add_observer' => $room->can_add_observer,
                'status' => $room->status,
                'created_at' => $room->created_at->format('Y-m-d'),
            ];

            return response()->json([
                'status' => true,
                'data' => $formattedRoom
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب القاعة ' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'القاعة غير موجودة'
            ], 404);
        }
    }

    /**
     * تحديث بيانات قاعة
     */
    public function update(Request $request, $id)
    {
        try {
            Log::info('تحديث القاعة ' . $id . ' بالبيانات: ', $request->all());

            $room = Room::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'floor_id' => 'required|exists:public.floors,id',
                'capacity' => 'required|integer|min:1|max:1000',
                'required_supervisors' => 'required|integer|min:1|max:10',
                'required_observers' => 'required|integer|min:1|max:20',
                'can_add_observer' => 'boolean',
                'status' => 'sometimes|in:available,unavailable',
            ], [
                'name.required' => 'اسم القاعة مطلوب',
                'name.max' => 'اسم القاعة طويل جداً',
                'floor_id.required' => 'الدور مطلوب',
                'floor_id.exists' => 'الدور المحدد غير موجود',
                'capacity.required' => 'السعة مطلوبة',
                'capacity.integer' => 'السعة يجب أن تكون رقماً صحيحاً',
                'capacity.min' => 'السعة يجب أن تكون أكبر من صفر',
                'required_supervisors.required' => 'عدد المشرفين المطلوبين مطلوب',
                'required_observers.required' => 'عدد الملاحظين المطلوبين مطلوب',
            ]);

            if ($validator->fails()) {
                Log::warning('فشل التحقق من صحة البيانات في التحديث: ', $validator->errors()->toArray());
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // التحقق من عدم تكرار اسم القاعة في نفس الدور (باستثناء القاعة الحالية)
            $existingRoom = Room::where('name', $request->name)
                ->where('floor_id', $request->floor_id)
                ->where('id', '!=', $id)
                ->first();

            if ($existingRoom) {
                return response()->json([
                    'status' => false,
                    'message' => 'يوجد قاعة بنفس الاسم في هذا الدور'
                ], 422);
            }

            $updateData = [
                'name' => trim($request->name),
                'floor_id' => $request->floor_id,
                'capacity' => $request->capacity,
                'required_supervisors' => $request->required_supervisors,
                'required_observers' => $request->required_observers,
                'can_add_observer' => $request->boolean('can_add_observer', false),
            ];

            // إضافة الحالة إذا تم إرسالها
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }

            $room->update($updateData);

            // جلب القاعة مع العلاقات
            $room = Room::with(['floor.building'])->find($room->id);

            // تنسيق البيانات للإرسال
            $formattedRoom = [
                'id' => $room->id,
                'name' => $room->name,
                'floor_id' => $room->floor_id,
                'building_id' => $room->floor->building_id,
                'floor_name' => $room->floor->name,
                'building_name' => $room->floor->building->name,
                'capacity' => $room->capacity,
                'required_supervisors' => $room->required_supervisors,
                'required_observers' => $room->required_observers,
                'can_add_observer' => $room->can_add_observer,
                'status' => $room->status,
                'created_at' => $room->created_at->format('Y-m-d'),
            ];

            Log::info('تم تحديث القاعة بنجاح: ' . $room->id);

            return response()->json([
                'status' => true,
                'message' => 'تم تحديث بيانات القاعة بنجاح',
                'data' => $formattedRoom
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ عام في تحديث القاعة: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تحديث بيانات القاعة',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * حذف قاعة (تغيير الحالة إلى غير متاحة)
     */
    public function destroy($id)
    {
        try {
            $room = Room::findOrFail($id);

            // التحقق من عدم وجود توزيعات حالية للقاعة
            $hasActiveAssignments = DB::table('public.assignments')
                ->where('room_id', $id)
                ->where('date', '>=', now()->format('Y-m-d'))
                ->exists();

            if ($hasActiveAssignments) {
                return response()->json([
                    'status' => false,
                    'message' => 'لا يمكن حذف القاعة لأنها مستخدمة في توزيعات حالية أو مستقبلية'
                ], 422);
            }

            $room->update(['status' => 'unavailable']);
            Log::info('تم حذف القاعة بنجاح: ' . $room->id);

            return response()->json([
                'status' => true,
                'message' => 'تم حذف القاعة بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في حذف القاعة ' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء حذف القاعة',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تغيير حالة القاعة
     */
    public function toggleStatus($id)
    {
        try {
            $room = Room::findOrFail($id);

            $newStatus = $room->status === 'available' ? 'unavailable' : 'available';
            $room->update(['status' => $newStatus]);

            Log::info('تم تغيير حالة القاعة ' . $room->id . ' إلى: ' . $newStatus);

            return response()->json([
                'status' => true,
                'message' => 'تم تغيير حالة القاعة بنجاح',
                'data' => ['new_status' => $newStatus]
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تغيير حالة القاعة ' . $id . ': ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تغيير حالة القاعة',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * الحصول على إحصائيات القاعات
     */
    public function statistics()
    {
        try {
            $stats = [
                'total' => Room::count(),
                'available' => Room::where('status', 'available')->count(),
                'unavailable' => Room::where('status', 'unavailable')->count(),
                'total_capacity' => Room::sum('capacity'),
                'avg_capacity' => Room::avg('capacity'),
                'total_supervisors_required' => Room::sum('required_supervisors'),
                'total_observers_required' => Room::sum('required_observers'),
                'rooms_with_extra_observer' => Room::where('can_add_observer', true)->count(),
            ];

            return response()->json([
                'status' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في إحصائيات القاعات: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب الإحصائيات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }
}
