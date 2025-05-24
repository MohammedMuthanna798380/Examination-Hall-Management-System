<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Users_s;
use App\Models\Room;
use App\Models\Assignment;
use App\Models\Notification;
use App\Models\AbsenceReplacement;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * الحصول على إحصائيات لوحة التحكم
     */
    public function getStatistics()
    {
        try {
            // إحصائيات المشرفين والملاحظين
            $supervisors = Users_s::where('type', 'supervisor')
                ->where('status', 'active')
                ->count();

            $observers = Users_s::where('type', 'observer')
                ->where('status', 'active')
                ->count();

            // إحصائيات القاعات
            $halls = Room::where('status', 'available')->count();

            // امتحانات اليوم
            $today = Carbon::today();
            $todayExams = Assignment::where('date', $today)
                ->distinct('room_id')
                ->count('room_id');

            return response()->json([
                'status' => true,
                'data' => [
                    'supervisors' => $supervisors,
                    'observers' => $observers,
                    'halls' => $halls,
                    'todayExams' => $todayExams
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب الإحصائيات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على حالات الغياب الحالية
     */
    public function getAbsenceData()
    {
        try {
            $today = Carbon::today();

            $absences = AbsenceReplacement::with(['room', 'originalUser'])
                ->where('date', $today)
                ->where('action_type', 'absence')
                ->get()
                ->map(function ($absence) {
                    return [
                        'name' => $absence->originalUser->name,
                        'type' => $absence->originalUser->type === 'supervisor' ? 'مشرف' : 'ملاحظ',
                        'hall' => $absence->room->name
                    ];
                });

            return response()->json([
                'status' => true,
                'data' => $absences
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب بيانات الغياب',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على امتحانات الغد
     */
    public function getTomorrowExams()
    {
        try {
            $tomorrow = Carbon::tomorrow();

            $exams = Assignment::with(['room.floor.building'])
                ->where('date', $tomorrow)
                ->get()
                ->groupBy('room_id')
                ->map(function ($assignments, $roomId) {
                    $assignment = $assignments->first();
                    $room = $assignment->room;

                    return [
                        'hall' => $room->name,
                        'building' => $room->floor->building->name,
                        'floor' => $room->floor->name,
                        'supervisors' => $room->required_supervisors,
                        'observers' => $room->required_observers
                    ];
                })
                ->values();

            return response()->json([
                'status' => true,
                'data' => $exams
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب امتحانات الغد',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على التنبيهات
     */
    public function getNotifications()
    {
        try {
            $notifications = Notification::with('room')
                ->where('status', 'unresolved')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) {
                    $type = $notification->deficiency_type === 'supervisor' ? 'مشرف' : 'ملاحظ';

                    return [
                        'id' => $notification->id,
                        'type' => 'warning',
                        'icon' => '⚠️',
                        'message' => "يوجد نقص في عدد {$type}ين لقاعة {$notification->room->name}",
                        'actionText' => 'معالجة'
                    ];
                });

            // إضافة تنبيهات المستخدمين المعلقين
            $suspendedUsers = Users_s::where('status', 'suspended')
                ->where('consecutive_absence_days', '>=', 2)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => 'suspended_' . $user->id,
                        'type' => 'info',
                        'icon' => 'ℹ️',
                        'message' => "تم تعليق مستخدم \"{$user->name}\" تلقائياً بسبب الغياب المتكرر",
                        'actionText' => 'استعراض'
                    ];
                });

            $allNotifications = $notifications->concat($suspendedUsers);

            return response()->json([
                'status' => true,
                'data' => $allNotifications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب التنبيهات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على إحصائيات سريعة
     */
    public function getQuickStats()
    {
        try {
            // أكثر القاعات استخداماً
            $mostUsedHall = Assignment::select('room_id', DB::raw('count(*) as usage_count'))
                ->with('room')
                ->groupBy('room_id')
                ->orderBy('usage_count', 'desc')
                ->first();

            // المشرف الأكثر إشرافاً
            $topSupervisor = Assignment::select('supervisor_id', DB::raw('count(*) as assignment_count'))
                ->with('supervisor')
                ->whereNotNull('supervisor_id')
                ->groupBy('supervisor_id')
                ->orderBy('assignment_count', 'desc')
                ->first();

            // نسبة الغياب
            $totalAssignments = Assignment::count();
            $absenceCount = AbsenceReplacement::where('action_type', 'absence')->count();
            $absenceRate = $totalAssignments > 0 ? round(($absenceCount / $totalAssignments) * 100, 1) : 0;

            // متوسط عدد الملاحظين
            $avgObservers = Room::where('status', 'available')
                ->avg('required_observers') ?? 0;

            return response()->json([
                'status' => true,
                'data' => [
                    'mostUsedHall' => $mostUsedHall ? $mostUsedHall->room->name : 'غير محدد',
                    'topSupervisor' => $topSupervisor ? $topSupervisor->supervisor->name : 'غير محدد',
                    'absenceRate' => $absenceRate . '%',
                    'avgObservers' => round($avgObservers, 1)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب الإحصائيات السريعة',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * التحقق من وجود توزيع لليوم الحالي
     */
    public function checkTodayDistribution()
    {
        try {
            $today = Carbon::today();

            $hasDistribution = Assignment::where('date', $today)->exists();

            return response()->json([
                'status' => true,
                'data' => [
                    'hasDistribution' => $hasDistribution
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء التحقق من التوزيع',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
