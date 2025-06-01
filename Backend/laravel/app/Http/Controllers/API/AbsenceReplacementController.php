<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DailyAssignment;
use App\Models\Users_s;
use App\Models\AbsenceReplacement;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AbsenceReplacementController extends Controller
{
    /**
     * الحصول على التوزيعات لتاريخ وفترة محددة
     */
    public function getAssignments(Request $request)
    {
        try {
            Log::info('=== جلب التوزيعات للغياب والاستبدال ===');
            Log::info('البيانات الواردة: ', $request->all());

            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
                'period' => 'required|in:morning,evening',
            ], [
                'date.required' => 'التاريخ مطلوب',
                'period.required' => 'الفترة مطلوبة',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // جلب التوزيعات من DailyAssignment
            $assignments = DailyAssignment::with(['room.floor.building', 'supervisor'])
                ->where('assignment_date', $request->date)
                ->where('period', $request->period)
                ->get();

            $supervisorData = [];
            $observerData = [];

            foreach ($assignments as $assignment) {
                // بيانات المشرف
                if ($assignment->supervisor) {
                    $supervisorData[] = [
                        'id' => $assignment->id,
                        'assignment_id' => $assignment->id,
                        'hallName' => $assignment->room->name,
                        'building' => $assignment->room->floor->building->name,
                        'floor' => $assignment->room->floor->name,
                        'supervisor' => [
                            'id' => $assignment->supervisor->id,
                            'name' => $assignment->supervisor->name,
                            'type' => $assignment->supervisor->type,
                            'rank' => $assignment->supervisor->rank,
                            'phone' => $assignment->supervisor->phone,
                            'consecutiveAbsences' => $assignment->supervisor->consecutive_absence_days,
                            'status' => $assignment->supervisor->status,
                        ],
                        'status' => $this->getUserStatus($assignment->supervisor->id, $request->date),
                        'replacementInfo' => $this->getReplacementInfo($assignment->supervisor->id, $request->date, $assignment->room->id)
                    ];
                }

                // بيانات الملاحظين
                if ($assignment->observer_ids && !empty($assignment->observer_ids)) {
                    foreach ($assignment->observer_ids as $observerId) {
                        $observer = Users_s::find($observerId);
                        if ($observer) {
                            $observerData[] = [
                                'id' => $assignment->id . '_' . $observer->id,
                                'assignment_id' => $assignment->id,
                                'hallName' => $assignment->room->name,
                                'building' => $assignment->room->floor->building->name,
                                'floor' => $assignment->room->floor->name,
                                'observer' => [
                                    'id' => $observer->id,
                                    'name' => $observer->name,
                                    'type' => $observer->type,
                                    'rank' => $observer->rank,
                                    'phone' => $observer->phone,
                                    'consecutiveAbsences' => $observer->consecutive_absence_days,
                                    'status' => $observer->status,
                                ],
                                'status' => $this->getUserStatus($observer->id, $request->date),
                                'replacementInfo' => $this->getReplacementInfo($observer->id, $request->date, $assignment->room->id)
                            ];
                        }
                    }
                }
            }

            Log::info('تم جلب ' . count($supervisorData) . ' مشرف و ' . count($observerData) . ' ملاحظ');

            return response()->json([
                'status' => true,
                'data' => [
                    'supervisors' => $supervisorData,
                    'observers' => $observerData
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب التوزيعات: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب البيانات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تسجيل غياب مستخدم
     */
    public function recordAbsence(Request $request)
    {
        try {
            Log::info('=== تسجيل غياب ===');
            Log::info('البيانات الواردة: ', $request->all());

            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:public.daily_assignments,id',
                'user_id' => 'required|exists:public.users_s,id',
                'user_type' => 'required|in:supervisor,observer',
                'reason' => 'nullable|string|max:255',
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

                // تسجيل الغياب في جدول absence_replacements
                AbsenceReplacement::create([
                    'date' => $assignment->assignment_date,
                    'room_id' => $assignment->room_id,
                    'original_user_id' => $user->id,
                    'replacement_user_id' => null,
                    'action_type' => 'absence',
                    'reason' => $request->reason ?? 'غياب',
                ]);

                // تحديث عداد الغياب للمستخدم
                $user->consecutive_absence_days += 1;
                $user->last_absence_date = $assignment->assignment_date;

                // التحقق من التعليق التلقائي
                $wasSuspended = false;
                if ($user->consecutive_absence_days >= 2) {
                    $user->status = 'suspended';
                    $wasSuspended = true;
                }

                $user->save();

                DB::commit();

                Log::info('تم تسجيل الغياب بنجاح للمستخدم: ' . $user->id);

                return response()->json([
                    'status' => true,
                    'message' => 'تم تسجيل الغياب بنجاح',
                    'data' => [
                        'user_id' => $user->id,
                        'new_absence_count' => $user->consecutive_absence_days,
                        'was_suspended' => $wasSuspended,
                        'user_status' => $user->status
                    ]
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
     * الاستبدال التلقائي
     */
    public function autoReplace(Request $request)
    {
        try {
            Log::info('=== الاستبدال التلقائي ===');
            Log::info('البيانات الواردة: ', $request->all());

            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:public.daily_assignments,id',
                'user_id' => 'required|exists:public.users_s,id',
                'user_type' => 'required|in:supervisor,observer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $assignment = DailyAssignment::with(['room', 'supervisor'])->findOrFail($request->assignment_id);
            $originalUser = Users_s::findOrFail($request->user_id);

            // البحث عن بديل مناسب
            $replacement = $this->findAutomaticReplacement(
                $assignment,
                $originalUser,
                $request->user_type
            );

            if (!$replacement) {
                return response()->json([
                    'status' => false,
                    'message' => 'لا يوجد مستخدم متاح للاستبدال التلقائي'
                ], 404);
            }

            DB::beginTransaction();

            try {
                // تنفيذ الاستبدال
                $this->executeReplacement(
                    $assignment,
                    $originalUser,
                    $replacement,
                    $request->user_type,
                    'auto_replacement',
                    'استبدال تلقائي'
                );

                DB::commit();

                Log::info('تم الاستبدال التلقائي بنجاح');

                return response()->json([
                    'status' => true,
                    'message' => "تم استبدال {$originalUser->name} بـ {$replacement->name} تلقائياً",
                    'data' => [
                        'original_user' => $originalUser->name,
                        'replacement_user' => $replacement->name,
                        'replacement_type' => 'automatic'
                    ]
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في الاستبدال التلقائي: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء الاستبدال التلقائي',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * الحصول على المستخدمين المتاحين للاستبدال اليدوي
     */
    public function getAvailableReplacements(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:public.daily_assignments,id',
                'user_type' => 'required|in:supervisor,observer',
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

            $assignment = DailyAssignment::with(['room', 'supervisor'])->findOrFail($request->assignment_id);

            // الحصول على المستخدمين المعينين بالفعل في هذا التاريخ والفترة
            $assignedUserIds = $this->getAssignedUserIds($request->date, $request->period);

            // البحث عن المستخدمين المتاحين
            $availableUsers = Users_s::where('type', $request->user_type)
                ->where('status', 'active')
                ->whereNotIn('id', $assignedUserIds)
                ->get()
                ->filter(function ($user) use ($assignment, $request) {
                    // تطبيق قواعد التوزيع
                    return $this->canUserBeAssigned($user, $assignment, $request->user_type);
                })
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'type' => $user->type,
                        'rank' => $user->rank,
                        'specialization' => $user->specialization,
                        'phone' => $user->phone,
                        'isAvailable' => true
                    ];
                })
                ->values();

            return response()->json([
                'status' => true,
                'data' => $availableUsers
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في جلب المتاحين للاستبدال: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب المتاحين للاستبدال',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * الاستبدال اليدوي
     */
    public function manualReplace(Request $request)
    {
        try {
            Log::info('=== الاستبدال اليدوي ===');
            Log::info('البيانات الواردة: ', $request->all());

            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:public.daily_assignments,id',
                'original_user_id' => 'required|exists:public.users_s,id',
                'replacement_user_id' => 'required|exists:public.users_s,id',
                'user_type' => 'required|in:supervisor,observer',
                'reason' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $assignment = DailyAssignment::findOrFail($request->assignment_id);
            $originalUser = Users_s::findOrFail($request->original_user_id);
            $replacementUser = Users_s::findOrFail($request->replacement_user_id);

            // التحقق من توافق النوع
            if ($replacementUser->type !== $request->user_type) {
                return response()->json([
                    'status' => false,
                    'message' => 'نوع المستخدم البديل لا يطابق النوع المطلوب'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // تنفيذ الاستبدال
                $this->executeReplacement(
                    $assignment,
                    $originalUser,
                    $replacementUser,
                    $request->user_type,
                    'manual_replacement',
                    $request->reason ?? 'استبدال يدوي'
                );

                DB::commit();

                Log::info('تم الاستبدال اليدوي بنجاح');

                return response()->json([
                    'status' => true,
                    'message' => "تم استبدال {$originalUser->name} بـ {$replacementUser->name} بنجاح",
                    'data' => [
                        'original_user' => $originalUser->name,
                        'replacement_user' => $replacementUser->name,
                        'replacement_type' => 'manual'
                    ]
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('خطأ في الاستبدال اليدوي: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء الاستبدال اليدوي',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    // =============== Helper Methods ===============

    /**
     * الحصول على حالة المستخدم
     */
    private function getUserStatus($userId, $date)
    {
        $absence = AbsenceReplacement::where('original_user_id', $userId)
            ->where('date', $date)
            ->where('action_type', 'absence')
            ->first();

        if ($absence) {
            return 'absent';
        }

        $replacement = AbsenceReplacement::where('original_user_id', $userId)
            ->where('date', $date)
            ->whereIn('action_type', ['auto_replacement', 'manual_replacement'])
            ->first();

        if ($replacement) {
            return 'replaced';
        }

        return 'assigned';
    }

    /**
     * الحصول على معلومات الاستبدال
     */
    private function getReplacementInfo($userId, $date, $roomId)
    {
        $replacement = AbsenceReplacement::with('replacementUser')
            ->where('original_user_id', $userId)
            ->where('date', $date)
            ->where('room_id', $roomId)
            ->whereIn('action_type', ['auto_replacement', 'manual_replacement'])
            ->first();

        if ($replacement && $replacement->replacementUser) {
            return [
                'type' => $replacement->action_type === 'auto_replacement' ? 'تلقائي' : 'يدوي',
                'replacement_name' => $replacement->replacementUser->name,
                'reason' => $replacement->reason
            ];
        }

        return null;
    }

    /**
     * البحث عن بديل تلقائي
     */
    private function findAutomaticReplacement($assignment, $originalUser, $userType)
    {
        // الحصول على المستخدمين المعينين بالفعل
        $assignedUserIds = $this->getAssignedUserIds(
            $assignment->assignment_date->format('Y-m-d'),
            $assignment->period
        );

        return Users_s::where('type', $userType)
            ->where('status', 'active')
            ->where('rank', $originalUser->rank) // نفس الرتبة أولاً
            ->whereNotIn('id', $assignedUserIds)
            ->get()
            ->filter(function ($user) use ($assignment, $userType) {
                return $this->canUserBeAssigned($user, $assignment, $userType);
            })
            ->sortBy(function ($user) {
                // ترتيب حسب عدد مرات المشاركة (الأقل أولاً)
                return $this->getUserParticipationCount($user->id);
            })
            ->first();
    }

    /**
     * تنفيذ الاستبدال
     */
    private function executeReplacement($assignment, $originalUser, $replacementUser, $userType, $actionType, $reason)
    {
        // تسجيل الاستبدال في جدول absence_replacements
        AbsenceReplacement::create([
            'date' => $assignment->assignment_date,
            'room_id' => $assignment->room_id,
            'original_user_id' => $originalUser->id,
            'replacement_user_id' => $replacementUser->id,
            'action_type' => $actionType,
            'reason' => $reason,
        ]);

        // تحديث التوزيع في daily_assignments
        if ($userType === 'supervisor') {
            $assignment->supervisor_id = $replacementUser->id;
        } else {
            // استبدال الملاحظ
            $observerIds = $assignment->observer_ids ?? [];
            $key = array_search($originalUser->id, $observerIds);

            if ($key !== false) {
                $observerIds[$key] = $replacementUser->id;
                $assignment->observer_ids = $observerIds;
            }
        }

        $assignment->assignment_type = 'manual';
        $assignment->notes = ($assignment->notes ?? '') . "\n" . $reason . " - " . now();
        $assignment->save();

        // تحديث سجل التاريخ
        $this->updateAssignmentHistory($assignment, $originalUser->id, $replacementUser->id, $userType);
    }

    /**
     * التحقق من إمكانية تعيين المستخدم
     */
    private function canUserBeAssigned($user, $assignment, $userType)
    {
        // التحقق من عدم العمل في نفس القاعة سابقاً
        $hasWorkedInRoom = DB::table('public.assignment_history')
            ->where('user_id', $user->id)
            ->where('room_id', $assignment->room_id)
            ->where('assignment_date', '>=', Carbon::parse($assignment->assignment_date)->subDays(30))
            ->exists();

        if ($hasWorkedInRoom) {
            return false;
        }

        // للملاحظين: التحقق من عدم العمل مع نفس المشرف
        if ($userType === 'observer' && $assignment->supervisor_id) {
            $hasWorkedWithSupervisor = DB::table('public.assignment_history')
                ->where('user_id', $user->id)
                ->where('supervisor_id', $assignment->supervisor_id)
                ->where('assignment_date', '>=', Carbon::parse($assignment->assignment_date)->subDays(30))
                ->exists();

            if ($hasWorkedWithSupervisor) {
                return false;
            }
        }

        return true;
    }

    /**
     * الحصول على المستخدمين المعينين في تاريخ وفترة محددة
     */
    private function getAssignedUserIds($date, $period)
    {
        $assignments = DailyAssignment::where('assignment_date', $date)
            ->where('period', $period)
            ->get();

        $userIds = [];

        foreach ($assignments as $assignment) {
            if ($assignment->supervisor_id) {
                $userIds[] = $assignment->supervisor_id;
            }

            if ($assignment->observer_ids) {
                $userIds = array_merge($userIds, $assignment->observer_ids);
            }
        }

        return array_unique($userIds);
    }

    /**
     * الحصول على عدد مرات مشاركة المستخدم
     */
    private function getUserParticipationCount($userId)
    {
        return DB::table('public.assignment_history')
            ->where('user_id', $userId)
            ->where('assignment_date', '>=', Carbon::now()->subDays(30))
            ->count();
    }

    /**
     * تحديث سجل التاريخ
     */
    private function updateAssignmentHistory($assignment, $originalUserId, $replacementUserId, $userType)
    {
        // حذف السجل القديم
        DB::table('public.assignment_history')
            ->where('assignment_date', $assignment->assignment_date)
            ->where('period', $assignment->period)
            ->where('user_id', $originalUserId)
            ->where('room_id', $assignment->room_id)
            ->delete();

        // إضافة السجل الجديد
        DB::table('public.assignment_history')->insert([
            'assignment_date' => $assignment->assignment_date,
            'period' => $assignment->period,
            'user_id' => $replacementUserId,
            'room_id' => $assignment->room_id,
            'user_type' => $userType,
            'supervisor_id' => $userType === 'observer' ? $assignment->supervisor_id : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
