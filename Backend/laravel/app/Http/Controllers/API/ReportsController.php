<?php
// Backend/laravel/app/Http/Controllers/API/ReportsController.php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Users_s;
use App\Models\Room;
use App\Models\DailyAssignment;
use App\Models\ExamSchedule;
use App\Models\AbsenceReplacement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ReportsController extends Controller
{
    /**
     * الحصول على نظرة عامة للنظام
     */
    public function getOverview(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subDays(30);
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

            // الإحصائيات العامة
            $totalSupervisors = Users_s::where('type', 'supervisor')
                ->where('status', '!=', 'deleted')
                ->count();

            $totalObservers = Users_s::where('type', 'observer')
                ->where('status', '!=', 'deleted')
                ->count();

            $totalHalls = Room::where('status', 'available')->count();

            $totalExams = DailyAssignment::whereBetween('assignment_date', [$startDate, $endDate])
                ->distinct(['assignment_date', 'period'])
                ->count();

            // معدل الحضور
            $totalAssignments = DailyAssignment::whereBetween('assignment_date', [$startDate, $endDate])
                ->count();

            $totalAbsences = AbsenceReplacement::where('action_type', 'absence')
                ->whereBetween('date', [$startDate, $endDate])
                ->count();

            $attendanceRate = $totalAssignments > 0
                ? round((($totalAssignments - $totalAbsences) / $totalAssignments) * 100, 1)
                : 0;

            // متوسط المشرفين والملاحظين لكل امتحان
            $avgSupervisorsPerExam = DailyAssignment::whereBetween('assignment_date', [$startDate, $endDate])
                ->whereNotNull('supervisor_id')
                ->count();
            $avgSupervisorsPerExam = $totalExams > 0 ? round($avgSupervisorsPerExam / $totalExams, 1) : 0;

            $avgObserversPerExam = DB::table('public.daily_assignments')
                ->whereBetween('assignment_date', [$startDate, $endDate])
                ->whereNotNull('observer_ids')
                ->sum(DB::raw('COALESCE(array_length(observer_ids, 1), 0)'));
            $avgObserversPerExam = $totalExams > 0 ? round($avgObserversPerExam / $totalExams, 1) : 0;

            // أكثر القاعات استخداماً
            $mostUsedHall = DailyAssignment::with('room')
                ->select('room_id', DB::raw('count(*) as usage_count'))
                ->whereBetween('assignment_date', [$startDate, $endDate])
                ->groupBy('room_id')
                ->orderBy('usage_count', 'desc')
                ->first();

            // أكثر المشرفين نشاطاً
            $mostActiveSupervisor = DailyAssignment::with('supervisor')
                ->select('supervisor_id', DB::raw('count(*) as assignment_count'))
                ->whereBetween('assignment_date', [$startDate, $endDate])
                ->whereNotNull('supervisor_id')
                ->groupBy('supervisor_id')
                ->orderBy('assignment_count', 'desc')
                ->first();

            // معدل الاستبدال
            $totalReplacements = AbsenceReplacement::whereIn('action_type', ['auto_replacement', 'manual_replacement'])
                ->whereBetween('date', [$startDate, $endDate])
                ->count();

            $replacementRate = $totalAssignments > 0
                ? round(($totalReplacements / $totalAssignments) * 100, 1)
                : 0;

            return response()->json([
                'status' => true,
                'data' => [
                    'totalSupervisors' => $totalSupervisors,
                    'totalObservers' => $totalObservers,
                    'totalHalls' => $totalHalls,
                    'totalExams' => $totalExams,
                    'attendanceRate' => $attendanceRate,
                    'avgSupervisorsPerExam' => $avgSupervisorsPerExam,
                    'avgObserversPerExam' => $avgObserversPerExam,
                    'mostUsedHall' => $mostUsedHall && $mostUsedHall->room ? $mostUsedHall->room->name : 'غير محدد',
                    'mostActiveSupervisor' => $mostActiveSupervisor && $mostActiveSupervisor->supervisor ? $mostActiveSupervisor->supervisor->name : 'غير محدد',
                    'replacementRate' => $replacementRate,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تقرير النظرة العامة: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب تقرير النظرة العامة',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تقرير الحضور والغياب
     */
    public function getAttendanceReport(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'user_type' => 'nullable|in:supervisor,observer,all',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subDays(30);
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();
            $userType = $request->user_type ?? 'all';

            // بناء الاستعلام
            $query = Users_s::where('status', '!=', 'deleted');

            if ($userType !== 'all') {
                $query->where('type', $userType);
            }

            $users = $query->get();

            $attendanceData = [];

            foreach ($users as $user) {
                // حساب إجمالي الأيام المعينة
                $totalDays = DailyAssignment::whereBetween('assignment_date', [$startDate, $endDate])
                    ->where(function ($q) use ($user) {
                        $q->where('supervisor_id', $user->id)
                            ->orWhereJsonContains('observer_ids', $user->id);
                    })
                    ->count();

                // حساب أيام الغياب
                $absenceDays = AbsenceReplacement::where('original_user_id', $user->id)
                    ->where('action_type', 'absence')
                    ->whereBetween('date', [$startDate, $endDate])
                    ->count();

                // حساب أيام الحضور
                $attendedDays = $totalDays - $absenceDays;

                // حساب معدل الحضور
                $attendanceRate = $totalDays > 0 ? round(($attendedDays / $totalDays) * 100, 1) : 0;

                if ($totalDays > 0) { // إظهار المستخدمين الذين لديهم توزيعات فقط
                    $attendanceData[] = [
                        'name' => $user->name,
                        'type' => $user->type,
                        'rank' => $user->rank,
                        'totalDays' => $totalDays,
                        'attendedDays' => $attendedDays,
                        'absenceDays' => $absenceDays,
                        'attendanceRate' => $attendanceRate,
                        'status' => $user->status,
                    ];
                }
            }

            // ترتيب حسب معدل الحضور (الأعلى أولاً)
            usort($attendanceData, function ($a, $b) {
                return $b['attendanceRate'] <=> $a['attendanceRate'];
            });

            return response()->json([
                'status' => true,
                'data' => $attendanceData
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تقرير الحضور والغياب: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب تقرير الحضور والغياب',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تقرير استخدام القاعات
     */
    public function getHallUsageReport(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subDays(30);
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

            $hallUsageData = Room::with(['floor.building'])
                ->where('status', 'available')
                ->get()
                ->map(function ($room) use ($startDate, $endDate) {
                    // حساب عدد مرات الاستخدام
                    $usageCount = DailyAssignment::where('room_id', $room->id)
                        ->whereBetween('assignment_date', [$startDate, $endDate])
                        ->count();

                    // حساب إجمالي الأيام في الفترة
                    $totalDays = $startDate->diffInDays($endDate) + 1;
                    $workingDays = 0;

                    for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
                        if (!$date->isFriday() && !$date->isSaturday()) {
                            $workingDays++;
                        }
                    }

                    // حساب معدل الاستخدام (مع احتساب الفترتين الصباحية والمسائية)
                    $maxPossibleUsage = $workingDays * 2; // فترتين يومياً
                    $utilizationRate = $maxPossibleUsage > 0
                        ? round(($usageCount / $maxPossibleUsage) * 100, 1)
                        : 0;

                    return [
                        'hallName' => $room->name,
                        'building' => $room->floor->building->name,
                        'floor' => $room->floor->name,
                        'capacity' => $room->capacity,
                        'usageCount' => $usageCount,
                        'utilizationRate' => $utilizationRate,
                    ];
                })
                ->sortByDesc('usageCount')
                ->values();

            return response()->json([
                'status' => true,
                'data' => $hallUsageData
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تقرير استخدام القاعات: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب تقرير استخدام القاعات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تقرير الاستبدالات
     */
    public function getReplacementReport(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subDays(30);
            $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

            $replacementData = AbsenceReplacement::with(['room', 'originalUser', 'replacementUser'])
                ->whereIn('action_type', ['auto_replacement', 'manual_replacement'])
                ->whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->get()
                ->map(function ($replacement) {
                    return [
                        'date' => $replacement->date->format('Y-m-d'),
                        'hallName' => $replacement->room->name,
                        'originalUser' => $replacement->originalUser->name,
                        'replacementUser' => $replacement->replacementUser ? $replacement->replacementUser->name : 'غير محدد',
                        'reason' => $replacement->reason ?? 'غير محدد',
                        'type' => $replacement->action_type === 'auto_replacement' ? 'تلقائي' : 'يدوي',
                        'userType' => $replacement->originalUser->type === 'supervisor' ? 'مشرف' : 'ملاحظ',
                    ];
                });

            return response()->json([
                'status' => true,
                'data' => $replacementData
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تقرير الاستبدالات: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب تقرير الاستبدالات',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * التقرير الشهري للتوزيع
     */
    public function getMonthlyDistribution(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'year' => 'nullable|integer|min:2020|max:2030',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $year = $request->year ?? Carbon::now()->year;

            $monthlyData = [];

            for ($month = 1; $month <= 12; $month++) {
                $startDate = Carbon::create($year, $month, 1);
                $endDate = $startDate->copy()->endOfMonth();

                // عدد أيام المشرفين
                $supervisorDays = DailyAssignment::whereBetween('assignment_date', [$startDate, $endDate])
                    ->whereNotNull('supervisor_id')
                    ->count();

                // عدد أيام الملاحظين
                $observerDays = DB::table('public.daily_assignments')
                    ->whereBetween('assignment_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->whereNotNull('observer_ids')
                    ->sum(DB::raw('COALESCE(array_length(observer_ids, 1), 0)'));

                // عدد الامتحانات (الأيام المختلفة)
                $totalExams = DailyAssignment::whereBetween('assignment_date', [$startDate, $endDate])
                    ->distinct(['assignment_date', 'period'])
                    ->count();

                $monthlyData[] = [
                    'month' => $startDate->format('M'),
                    'monthName' => $startDate->translatedFormat('F'), // اسم الشهر بالعربية
                    'supervisorDays' => $supervisorDays,
                    'observerDays' => (int)$observerDays,
                    'totalExams' => $totalExams,
                ];
            }

            return response()->json([
                'status' => true,
                'data' => $monthlyData
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في التقرير الشهري: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء جلب التقرير الشهري',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }

    /**
     * تصدير التقرير بصيغة PDF أو Excel
     */
    public function exportReport(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'report_type' => 'required|in:overview,attendance,hall-usage,replacements,distribution',
                'format' => 'required|in:pdf,excel',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // هنا يمكن تنفيذ منطق التصدير الفعلي
            // لكن للآن سنرجع رسالة نجاح

            return response()->json([
                'status' => true,
                'message' => "سيتم تصدير تقرير {$request->report_type} بصيغة {$request->format}",
                'data' => [
                    'report_type' => $request->report_type,
                    'format' => $request->format,
                    'generated_at' => now()->toDateTimeString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تصدير التقرير: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'حدث خطأ أثناء تصدير التقرير',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ في الخادم'
            ], 500);
        }
    }
}
