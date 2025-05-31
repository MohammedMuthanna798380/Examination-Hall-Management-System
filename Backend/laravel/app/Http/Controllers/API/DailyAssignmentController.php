<?php
// Backend/laravel/app/Http/Controllers/API/DailyAssignmentController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DailyAssignment;
use App\Models\Room;
use App\Models\Users_s;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DailyAssignmentController extends Controller
{
    /**
     * تنفيذ التوزيع التلقائي
     */
    public function performAutomaticAssignment(Request $request)
    {
        try {
            Log::info('=== بداية التوزيع التلقائي ===');
            Log::info('البيانات الواردة: ', $request->all());

            // التحقق من صحة البيانات
            $validator = Validator::make($request->all(), [
                'date' => 'required|date|after_or_equal:today',
                'period' => 'required|in:morning,evening',
                'selected_halls' => 'required|array|min:1',
                'selected_halls.*' => 'exists:public.rooms,id',
            ], [
                'date.required' => 'التاريخ مطلوب',
                'date.after_or_equal' => 'لا يمكن إنشاء توزيع لتاريخ ماضي',
                'period.required' => 'الفترة مطلوبة',
                'selected_halls.required' => 'يجب اختيار قاعة واحدة على الأقل',
                'selected_halls.min' => 'يجب اختيار قاعة واحدة على الأقل',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // التحقق من عدم وجود توزيع سابق لنفس التاريخ والفترة
            $existingAssignments = DailyAssignment::where('assignment_date', $request->date)
                ->where('period', $request->period)
                ->whereIn('room_id', $request->selected_halls)
                ->exists();

            if ($existingAssignments) {
                return response()->json([
                    'status' => false,
                    'message' => 'يوجد توزيع سابق لبعض القاعات في نفس التاريخ والفترة'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // تنفيذ خوارزمية التوزيع
                $assignmentResult = $this->executeDistributionAlgorithm(
                    $request->date,
                    $request->period,
                    $request->selected_halls
                );

                // حفظ النتائج في قاعدة البيانات
                $this->saveAssignmentResults($assignmentResult);

                DB::commit();

                Log::info('✅ تم التوزيع بنجاح');

                return response()->json([
                    'status' => true,
                    'message' => 'تم التوزيع بنجاح',
                    'data' => $assignmentResult
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('❌ خطأ في التوزيع التلقائي: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء التوزيع',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * خوارزمية التوزيع الرئيسية
     */
    private function executeDistributionAlgorithm($date, $period, $selectedHallIds)
    {
        Log::info('تنفيذ خوارزمية التوزيع للتاريخ: ' . $date . ' الفترة: ' . $period);

        // الحصول على القاعات المختارة
        $rooms = Room::with(['floor.building'])
            ->whereIn('id', $selectedHallIds)
            ->where('status', 'available')
            ->get();

        // الحصول على المشرفين والملاحظين النشطين
        $availableSupervisors = $this->getAvailableSupervisors($date, $period);
        $availableObservers = $this->getAvailableObservers($date, $period);

        Log::info('المشرفين المتاحين: ' . $availableSupervisors->count());
        Log::info('الملاحظين المتاحين: ' . $availableObservers->count());

        $assignments = [];
        $usedSupervisors = [];
        $usedObservers = [];
        $notifications = [];

        foreach ($rooms as $room) {
            Log::info('معالجة القاعة: ' . $room->name);

            $assignment = [
                'room_id' => $room->id,
                'room_name' => $room->name,
                'building_name' => $room->floor->building->name,
                'floor_name' => $room->floor->name,
                'required_supervisors' => $room->required_supervisors,
                'required_observers' => $room->required_observers,
                'assigned_supervisors' => [],
                'assigned_observers' => [],
                'status' => 'complete',
                'assignment_type' => 'automatic'
            ];

            // 1. توزيع المشرفين
            $supervisorAssignment = $this->assignSupervisors(
                $room,
                $availableSupervisors,
                $usedSupervisors,
                $date,
                $period
            );

            $assignment['assigned_supervisors'] = $supervisorAssignment['assigned'];
            $usedSupervisors = array_merge($usedSupervisors, $supervisorAssignment['used_ids']);

            if (count($assignment['assigned_supervisors']) < $room->required_supervisors) {
                $assignment['status'] = 'partial';
                $notifications[] = [
                    'type' => 'error',
                    'message' => "نقص في المشرفين لقاعة {$room->name}",
                    'room_id' => $room->id,
                    'deficiency_type' => 'supervisor'
                ];
            }

            // 2. توزيع الملاحظين
            $assignedSupervisorId = $assignment['assigned_supervisors'][0]['id'] ?? null;

            $observerAssignment = $this->assignObservers(
                $room,
                $availableObservers,
                $usedObservers,
                $assignedSupervisorId,
                $date,
                $period
            );

            $assignment['assigned_observers'] = $observerAssignment['assigned'];
            $usedObservers = array_merge($usedObservers, $observerAssignment['used_ids']);

            if (count($assignment['assigned_observers']) < $room->required_observers) {
                $assignment['status'] = 'partial';
                $notifications[] = [
                    'type' => 'warning',
                    'message' => "نقص في الملاحظين لقاعة {$room->name}",
                    'room_id' => $room->id,
                    'deficiency_type' => 'observer'
                ];
            }

            $assignments[] = $assignment;
        }

        // إحصائيات النتائج
        $statistics = [
            'total_rooms' => count($rooms),
            'complete_assignments' => count(array_filter($assignments, fn($a) => $a['status'] === 'complete')),
            'partial_assignments' => count(array_filter($assignments, fn($a) => $a['status'] === 'partial')),
            'total_assigned_supervisors' => count($usedSupervisors),
            'total_assigned_observers' => count($usedObservers),
        ];

        Log::info('إحصائيات التوزيع: ', $statistics);

        return [
            'date' => $date,
            'period' => $period,
            'assignments' => $assignments,
            'notifications' => $notifications,
            'statistics' => $statistics
        ];
    }

    /**
     * الحصول على المشرفين المتاحين
     */
    private function getAvailableSupervisors($date, $period)
    {
        return Users_s::where('type', 'supervisor')
            ->where('status', 'active')
            ->whereDoesntHave('absences', function ($query) use ($date) {
                $query->where('date', $date);
            })
            ->get()
            ->sortBy(function ($supervisor) use ($date, $period) {
                // ترتيب حسب الأولوية
                $priority = 0;

                // أولوية موظفي الكلية
                if ($supervisor->rank === 'college_employee') {
                    $priority += 1000;
                }

                // عكس عدد مرات المشاركة (الأقل مشاركة أولاً)
                $participationCount = $this->getUserParticipationCount($supervisor->id, $date);
                $priority += (1000 - $participationCount);

                return $priority;
            })
            ->reverse(); // من الأعلى أولوية للأقل
    }

    /**
     * الحصول على الملاحظين المتاحين
     */
    private function getAvailableObservers($date, $period)
    {
        return Users_s::where('type', 'observer')
            ->where('status', 'active')
            ->whereDoesntHave('absences', function ($query) use ($date) {
                $query->where('date', $date);
            })
            ->get()
            ->sortBy(function ($observer) use ($date, $period) {
                // ترتيب حسب الأولوية
                $priority = 0;

                // أولوية موظفي الكلية
                if ($observer->rank === 'college_employee') {
                    $priority += 1000;
                }

                // عكس عدد مرات المشاركة (الأقل مشاركة أولاً)
                $participationCount = $this->getUserParticipationCount($observer->id, $date);
                $priority += (1000 - $participationCount);

                return $priority;
            })
            ->reverse();
    }

    /**
     * توزيع المشرفين
     */
    private function assignSupervisors($room, $availableSupervisors, $usedSupervisors, $date, $period)
    {
        $assigned = [];
        $usedIds = [];

        $requiredCount = $room->required_supervisors;

        foreach ($availableSupervisors as $supervisor) {
            if (count($assigned) >= $requiredCount) {
                break;
            }

            // تحقق من عدم استخدامه بالفعل
            if (in_array($supervisor->id, $usedSupervisors)) {
                continue;
            }

            // تحقق من عدم إشرافه على نفس القاعة سابقاً
            if ($this->hasUserWorkedInRoom($supervisor->id, $room->id, $date)) {
                continue;
            }

            $assigned[] = [
                'id' => $supervisor->id,
                'name' => $supervisor->name,
                'type' => $supervisor->type,
                'rank' => $supervisor->rank,
                'missing' => false
            ];

            $usedIds[] = $supervisor->id;
        }

        // إضافة عناصر مفقودة إذا لم نحصل على العدد المطلوب
        while (count($assigned) < $requiredCount) {
            $assigned[] = [
                'id' => null,
                'name' => 'غير محدد',
                'type' => 'supervisor',
                'rank' => null,
                'missing' => true
            ];
        }

        return [
            'assigned' => $assigned,
            'used_ids' => $usedIds
        ];
    }

    /**
     * توزيع الملاحظين
     */
    private function assignObservers($room, $availableObservers, $usedObservers, $supervisorId, $date, $period)
    {
        $assigned = [];
        $usedIds = [];

        $requiredCount = $room->required_observers;

        foreach ($availableObservers as $observer) {
            if (count($assigned) >= $requiredCount) {
                break;
            }

            // تحقق من عدم استخدامه بالفعل
            if (in_array($observer->id, $usedObservers)) {
                continue;
            }

            // تحقق من عدم عمله في نفس القاعة سابقاً
            if ($this->hasUserWorkedInRoom($observer->id, $room->id, $date)) {
                continue;
            }

            // تحقق من عدم عمله مع نفس المشرف سابقاً
            if ($supervisorId && $this->hasObserverWorkedWithSupervisor($observer->id, $supervisorId, $date)) {
                continue;
            }

            $assigned[] = [
                'id' => $observer->id,
                'name' => $observer->name,
                'type' => $observer->type,
                'rank' => $observer->rank,
                'missing' => false
            ];

            $usedIds[] = $observer->id;
        }

        // إضافة عناصر مفقودة إذا لم نحصل على العدد المطلوب
        while (count($assigned) < $requiredCount) {
            $assigned[] = [
                'id' => null,
                'name' => 'غير محدد',
                'type' => 'observer',
                'rank' => null,
                'missing' => true
            ];
        }

        return [
            'assigned' => $assigned,
            'used_ids' => $usedIds
        ];
    }

    /**
     * التحقق من عمل المستخدم في نفس القاعة سابقاً
     */
    private function hasUserWorkedInRoom($userId, $roomId, $currentDate)
    {
        // البحث في الـ 30 يوم الماضية
        $thirtyDaysAgo = Carbon::parse($currentDate)->subDays(30);

        return DB::table('public.assignment_history')
            ->where('user_id', $userId)
            ->where('room_id', $roomId)
            ->where('assignment_date', '>=', $thirtyDaysAgo)
            ->where('assignment_date', '<', $currentDate)
            ->exists();
    }

    /**
     * التحقق من عمل الملاحظ مع نفس المشرف سابقاً
     */
    private function hasObserverWorkedWithSupervisor($observerId, $supervisorId, $currentDate)
    {
        // البحث في الـ 30 يوم الماضية
        $thirtyDaysAgo = Carbon::parse($currentDate)->subDays(30);

        return DB::table('public.assignment_history')
            ->where('user_id', $observerId)
            ->where('supervisor_id', $supervisorId)
            ->where('assignment_date', '>=', $thirtyDaysAgo)
            ->where('assignment_date', '<', $currentDate)
            ->exists();
    }

    /**
     * الحصول على عدد مرات مشاركة المستخدم
     */
    private function getUserParticipationCount($userId, $currentDate)
    {
        $thirtyDaysAgo = Carbon::parse($currentDate)->subDays(30);

        return DB::table('public.assignment_history')
            ->where('user_id', $userId)
            ->where('assignment_date', '>=', $thirtyDaysAgo)
            ->where('assignment_date', '<', $currentDate)
            ->count();
    }

    /**
     * حفظ نتائج التوزيع
     */
    private function saveAssignmentResults($assignmentResult)
    {
        foreach ($assignmentResult['assignments'] as $assignment) {
            // حفظ التوزيع الرئيسي
            $observerIds = array_filter(
                array_map(
                    fn($observer) => $observer['missing'] ? null : $observer['id'],
                    $assignment['assigned_observers']
                )
            );

            $supervisorId = null;
            if (!empty($assignment['assigned_supervisors']) && !$assignment['assigned_supervisors'][0]['missing']) {
                $supervisorId = $assignment['assigned_supervisors'][0]['id'];
            }

            $dailyAssignment = DailyAssignment::create([
                'assignment_date' => $assignmentResult['date'],
                'period' => $assignmentResult['period'],
                'room_id' => $assignment['room_id'],
                'supervisor_id' => $supervisorId,
                'observer_ids' => $observerIds,
                'status' => $assignment['status'],
                'assignment_type' => $assignment['assignment_type'],
            ]);

            // حفظ التاريخ في assignment_history
            // حفظ المشرف
            if ($supervisorId) {
                DB::table('public.assignment_history')->insert([
                    'assignment_date' => $assignmentResult['date'],
                    'period' => $assignmentResult['period'],
                    'user_id' => $supervisorId,
                    'room_id' => $assignment['room_id'],
                    'user_type' => 'supervisor',
                    'supervisor_id' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // حفظ الملاحظين
            foreach ($observerIds as $observerId) {
                if ($observerId) {
                    DB::table('public.assignment_history')->insert([
                        'assignment_date' => $assignmentResult['date'],
                        'period' => $assignmentResult['period'],
                        'user_id' => $observerId,
                        'room_id' => $assignment['room_id'],
                        'user_type' => 'observer',
                        'supervisor_id' => $supervisorId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // حفظ الإشعارات
        foreach ($assignmentResult['notifications'] as $notification) {
            if (isset($notification['room_id']) && isset($notification['deficiency_type'])) {
                DB::table('public.notifications')->insert([
                    'date' => $assignmentResult['date'],
                    'room_id' => $notification['room_id'],
                    'deficiency_type' => $notification['deficiency_type'],
                    'status' => 'unresolved',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * الحصول على التوزيع لتاريخ وفترة محددة
     */
    public function getAssignmentByDate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
                'period' => 'required|in:morning,evening',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $assignments = DailyAssignment::with(['room.floor.building', 'supervisor'])
                ->where('assignment_date', $request->date)
                ->where('period', $request->period)
                ->get();

            $formattedAssignments = $assignments->map(function ($assignment) {
                return $assignment->getFullDetails();
            });

            return response()->json([
                'status' => true,
                'data' => $formattedAssignments
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب التوزيع: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب التوزيع',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * حفظ التوزيع النهائي
     */
    public function saveAssignment(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
                'period' => 'required|in:morning,evening',
                'assignments' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // تحديث حالة التوزيعات إلى محفوظة
            DailyAssignment::where('assignment_date', $request->date)
                ->where('period', $request->period)
                ->update(['notes' => 'تم الحفظ في: ' . now()]);

            return response()->json([
                'status' => true,
                'message' => 'تم حفظ التوزيع بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في حفظ التوزيع: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء حفظ التوزيع',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * حذف التوزيع
     */
    public function deleteAssignment(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
                'period' => 'required|in:morning,evening',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // حذف سجلات التاريخ
                DB::table('public.assignment_history')
                    ->where('assignment_date', $request->date)
                    ->where('period', $request->period)
                    ->delete();

                // حذف التوزيعات
                DailyAssignment::where('assignment_date', $request->date)
                    ->where('period', $request->period)
                    ->delete();

                // حذف الإشعارات المرتبطة
                DB::table('public.notifications')
                    ->where('date', $request->date)
                    ->delete();

                DB::commit();

                return response()->json([
                    'status' => true,
                    'message' => 'تم حذف التوزيع بنجاح'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في حذف التوزيع: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء حذف التوزيع',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * استبدال مشرف أو ملاحظ
     */
    public function replaceUser(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:public.daily_assignments,id',
                'user_type' => 'required|in:supervisor,observer',
                'original_user_id' => 'nullable|exists:public.users_s,id',
                'replacement_user_id' => 'required|exists:public.users_s,id',
                'reason' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                $assignment = DailyAssignment::findOrFail($request->assignment_id);
                $replacementUser = Users_s::findOrFail($request->replacement_user_id);

                // التحقق من توافق النوع
                if ($replacementUser->type !== $request->user_type) {
                    return response()->json([
                        'status' => false,
                        'message' => 'نوع المستخدم البديل لا يطابق النوع المطلوب'
                    ], 422);
                }

                if ($request->user_type === 'supervisor') {
                    $assignment->supervisor_id = $request->replacement_user_id;
                } else {
                    // استبدال ملاحظ
                    $observerIds = $assignment->observer_ids ?? [];

                    if ($request->original_user_id) {
                        // استبدال ملاحظ موجود
                        $key = array_search($request->original_user_id, $observerIds);
                        if ($key !== false) {
                            $observerIds[$key] = $request->replacement_user_id;
                        }
                    } else {
                        // إضافة ملاحظ جديد
                        $observerIds[] = $request->replacement_user_id;
                    }

                    $assignment->observer_ids = array_values($observerIds);
                }

                $assignment->assignment_type = 'manual';
                $assignment->notes = ($assignment->notes ?? '') . "\nاستبدال: " . $request->reason . " في " . now();
                $assignment->save();

                // تسجيل في سجل الغياب والاستبدال
                DB::table('public.absence_replacements')->insert([
                    'date' => $assignment->assignment_date,
                    'room_id' => $assignment->room_id,
                    'original_user_id' => $request->original_user_id,
                    'replacement_user_id' => $request->replacement_user_id,
                    'action_type' => 'manual_replacement',
                    'reason' => $request->reason,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // تحديث سجل التاريخ
                if ($request->original_user_id) {
                    DB::table('public.assignment_history')
                        ->where('assignment_date', $assignment->assignment_date)
                        ->where('period', $assignment->period)
                        ->where('user_id', $request->original_user_id)
                        ->where('room_id', $assignment->room_id)
                        ->delete();
                }

                DB::table('public.assignment_history')->insert([
                    'assignment_date' => $assignment->assignment_date,
                    'period' => $assignment->period,
                    'user_id' => $request->replacement_user_id,
                    'room_id' => $assignment->room_id,
                    'user_type' => $request->user_type,
                    'supervisor_id' => $request->user_type === 'observer' ? $assignment->supervisor_id : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::commit();

                return response()->json([
                    'status' => true,
                    'message' => 'تم الاستبدال بنجاح',
                    'data' => $assignment->getFullDetails()
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في الاستبدال: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء الاستبدال',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تسجيل غياب
     */
    public function recordAbsence(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:public.daily_assignments,id',
                'user_id' => 'required|exists:public.users_s,id',
                'reason' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                $assignment = DailyAssignment::findOrFail($request->assignment_id);
                $user = Users_s::findOrFail($request->user_id);

                // تسجيل الغياب
                DB::table('public.absence_replacements')->insert([
                    'date' => $assignment->assignment_date,
                    'room_id' => $assignment->room_id,
                    'original_user_id' => $request->user_id,
                    'replacement_user_id' => null,
                    'action_type' => 'absence',
                    'reason' => $request->reason,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // تحديث عداد الغياب للمستخدم
                $user->consecutive_absence_days += 1;
                $user->last_absence_date = $assignment->assignment_date;

                // التعليق التلقائي بعد يومين متتاليين
                if ($user->consecutive_absence_days >= 2) {
                    $user->status = 'suspended';
                }

                $user->save();

                DB::commit();

                return response()->json([
                    'status' => true,
                    'message' => 'تم تسجيل الغياب بنجاح',
                    'user_status' => $user->status
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في تسجيل الغياب: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تسجيل الغياب',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * الحصول على الملاحظين/المشرفين المتاحين للاستبدال
     */
    public function getAvailableForReplacement(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
                'period' => 'required|in:morning,evening',
                'user_type' => 'required|in:supervisor,observer',
                'room_id' => 'required|exists:public.rooms,id',
                'supervisor_id' => 'nullable|exists:public.users_s,id', // للملاحظين فقط
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // الحصول على المستخدمين المعينين بالفعل في هذا التاريخ والفترة
            $assignedUserIds = DailyAssignment::where('assignment_date', $request->date)
                ->where('period', $request->period)
                ->get()
                ->flatMap(function ($assignment) {
                    $ids = [];
                    if ($assignment->supervisor_id) {
                        $ids[] = $assignment->supervisor_id;
                    }
                    if ($assignment->observer_ids) {
                        $ids = array_merge($ids, $assignment->observer_ids);
                    }
                    return $ids;
                })
                ->unique()
                ->values()
                ->toArray();

            $query = Users_s::where('type', $request->user_type)
                ->where('status', 'active')
                ->whereNotIn('id', $assignedUserIds);

            // فلترة حسب القواعد
            if ($request->user_type === 'supervisor') {
                // تجنب المشرفين الذين عملوا في نفس القاعة
                $query->whereDoesntHave('supervisorAssignments', function ($q) use ($request) {
                    $q->where('room_id', $request->room_id)
                        ->where('date', '>=', Carbon::parse($request->date)->subDays(30));
                });
            } else {
                // للملاحظين
                $query->whereDoesntHave('observerAssignments', function ($q) use ($request) {
                    $q->where('room_id', $request->room_id)
                        ->where('date', '>=', Carbon::parse($request->date)->subDays(30));
                });

                // تجنب الملاحظين الذين عملوا مع نفس المشرف
                if ($request->supervisor_id) {
                    // البحث في assignment_history
                    $observersWithSameSupervisor = DB::table('public.assignment_history')
                        ->where('supervisor_id', $request->supervisor_id)
                        ->where('assignment_date', '>=', Carbon::parse($request->date)->subDays(30))
                        ->pluck('user_id')
                        ->toArray();

                    $query->whereNotIn('id', $observersWithSameSupervisor);
                }
            }

            $availableUsers = $query->orderBy('rank') // موظفي الكلية أولاً
                ->orderBy('name')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'type' => $user->type,
                        'rank' => $user->rank,
                        'specialization' => $user->specialization,
                        'phone' => $user->phone,
                    ];
                });

            return response()->json([
                'status' => true,
                'data' => $availableUsers
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب المتاحين للاستبدال: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب البيانات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }
}
