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
            Log::info('=== بداية تحميل تقرير النظرة العامة ===');

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

            // تحديد التواريخ بشكل صحيح
            $startDate = $request->start_date ? $request->start_date : Carbon::now()->subDays(30)->format('Y-m-d');
            $endDate = $request->end_date ? $request->end_date : Carbon::now()->format('Y-m-d');

            Log::info('فترة التقرير من: ' . $startDate . ' إلى: ' . $endDate);

            // إحصائيات أساسية آمنة
            $totalSupervisors = $this->safeCount(function() {
                return Users_s::where('type', 'supervisor')
                    ->where('status', '!=', 'deleted')
                    ->count();
            });

            $totalObservers = $this->safeCount(function() {
                return Users_s::where('type', 'observer')
                    ->where('status', '!=', 'deleted')
                    ->count();
            });

            $totalHalls = $this->safeCount(function() {
                return Room::where('status', 'available')->count();
            });

            // استعلام آمن للامتحانات
            $totalExams = $this->safeCount(function() use ($startDate, $endDate) {
                return DB::table('public.daily_assignments')
                    ->where('assignment_date', '>=', $startDate)
                    ->where('assignment_date', '<=', $endDate)
                    ->distinct()
                    ->count(DB::raw('CONCAT(assignment_date, period)'));
            });

            // حساب معدل الحضور بشكل آمن
            $totalAssignments = $this->safeCount(function() use ($startDate, $endDate) {
                return DB::table('public.daily_assignments')
                    ->where('assignment_date', '>=', $startDate)
                    ->where('assignment_date', '<=', $endDate)
                    ->count();
            });

            $totalAbsences = $this->safeCount(function() use ($startDate, $endDate) {
                return DB::table('public.absence_replacements')
                    ->where('action_type', 'absence')
                    ->where('date', '>=', $startDate)
                    ->where('date', '<=', $endDate)
                    ->count();
            });

            $attendanceRate = $totalAssignments > 0
                ? round((($totalAssignments - $totalAbsences) / $totalAssignments) * 100, 1)
                : 0;

            // حساب المتوسطات
            $avgSupervisorsPerExam = $totalExams > 0 ? round($totalAssignments / $totalExams, 1) : 0;

            // حساب الملاحظين بشكل آمن
            $totalObserverAssignments = $this->safeCount(function() use ($startDate, $endDate) {
                return DB::table('public.daily_assignments')
                    ->where('assignment_date', '>=', $startDate)
                    ->where('assignment_date', '<=', $endDate)
                    ->whereNotNull('observer_ids')
                    ->get()
                    ->sum(function($assignment) {
                        $observerIds = json_decode($assignment->observer_ids, true);
                        return is_array($observerIds) ? count($observerIds) : 0;
                    });
            });

            $avgObserversPerExam = $totalExams > 0 ? round($totalObserverAssignments / $totalExams, 1) : 0;

            // أكثر القاعات استخداماً
            $mostUsedHall = $this->getMostUsedHall($startDate, $endDate);

            // أكثر المشرفين نشاطاً
            $mostActiveSupervisor = $this->getMostActiveSupervisor($startDate, $endDate);

            // معدل الاستبدال
            $totalReplacements = $this->safeCount(function() use ($startDate, $endDate) {
                return DB::table('public.absence_replacements')
                    ->whereIn('action_type', ['auto_replacement', 'manual_replacement'])
                    ->where('date', '>=', $startDate)
                    ->where('date', '<=', $endDate)
                    ->count();
            });

            $replacementRate = $totalAssignments > 0
                ? round(($totalReplacements / $totalAssignments) * 100, 1)
                : 0;

            Log::info('تم حساب جميع الإحصائيات بنجاح');

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
                    'mostUsedHall' => $mostUsedHall,
                    'mostActiveSupervisor' => $mostActiveSupervisor,
                    'replacementRate' => $replacementRate,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('خطأ في تقرير النظرة العامة: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

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
            Log::info('=== بداية تحميل تقرير الحضور والغياب ===');

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

            $startDate = $request->start_date ? $request->start_date : Carbon::now()->subDays(30)->format('Y-m-d');
            $endDate = $request->end_date ? $request->end_date : Carbon::now()->format('Y-m-d');
            $userType = $request->user_type ?? 'all';

            // بناء الاستعلام
            $query = Users_s::where('status', '!=', 'deleted');

            if ($userType !== 'all') {
                $query->where('type', $userType);
            }

            $users = $query->get();

            $attendanceData = [];

            foreach ($users as $user) {
                try {
                    // حساب إجمالي الأيام المعينة بشكل آمن
                    $totalDays = DB::table('public.daily_assignments')
                        ->where('assignment_date', '>=', $startDate)
                        ->where('assignment_date', '<=', $endDate)
                        ->where(function ($q) use ($user) {
                            $q->where('supervisor_id', $user->id)
                                ->orWhereRaw("observer_ids::text LIKE ?", ['%"' . $user->id . '"%']);
                        })
                        ->count();

                    // حساب أيام الغياب
                    $absenceDays = DB::table('public.absence_replacements')
                        ->where('original_user_id', $user->id)
                        ->where('action_type', 'absence')
                        ->where('date', '>=', $startDate)
                        ->where('date', '<=', $endDate)
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
                } catch (\Exception $e) {
                    Log::warning('خطأ في حساب بيانات المستخدم ' . $user->id . ': ' . $e->getMessage());
                    continue;
                }
            }

            // ترتيب حسب معدل الحضور (الأعلى أولاً)
            usort($attendanceData, function ($a, $b) {
                return $b['attendanceRate'] <=> $a['attendanceRate'];
            });

            Log::info('تم تحميل تقرير الحضور بنجاح');

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
            Log::info('=== بداية تحميل تقرير استخدام القاعات ===');

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

            $startDate = $request->start_date ? $request->start_date : Carbon::now()->subDays(30)->format('Y-m-d');
            $endDate = $request->end_date ? $request->end_date : Carbon::now()->format('Y-m-d');

            $hallUsageData = Room::with(['floor.building'])
                ->where('status', 'available')
                ->get()
                ->map(function ($room) use ($startDate, $endDate) {
                    try {
                        // حساب عدد مرات الاستخدام
                        $usageCount = DB::table('public.daily_assignments')
                            ->where('room_id', $room->id)
                            ->where('assignment_date', '>=', $startDate)
                            ->where('assignment_date', '<=', $endDate)
                            ->count();

                        // حساب معدل الاستخدام تقريبي
                        $utilizationRate = $usageCount > 0 ? min(100, $usageCount * 5) : 0;

                        return [
                            'hallName' => $room->name,
                            'building' => $room->floor->building->name,
                            'floor' => $room->floor->name,
                            'capacity' => $room->capacity,
                            'usageCount' => $usageCount,
                            'utilizationRate' => round($utilizationRate, 1),
                        ];
                    } catch (\Exception $e) {
                        Log::warning('خطأ في حساب استخدام القاعة ' . $room->id . ': ' . $e->getMessage());
                        return [
                            'hallName' => $room->name,
                            'building' => $room->floor->building->name ?? 'غير محدد',
                            'floor' => $room->floor->name ?? 'غير محدد',
                            'capacity' => $room->capacity,
                            'usageCount' => 0,
                            'utilizationRate' => 0,
                        ];
                    }
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
            Log::info('=== بداية تحميل تقرير الاستبدالات ===');

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

            $startDate = $request->start_date ? $request->start_date : Carbon::now()->subDays(30)->format('Y-m-d');
            $endDate = $request->end_date ? $request->end_date : Carbon::now()->format('Y-m-d');

            $replacementData = DB::table('public.absence_replacements as ar')
                ->join('public.rooms as r', 'ar.room_id', '=', 'r.id')
                ->join('public.users_s as original', 'ar.original_user_id', '=', 'original.id')
                ->leftJoin('public.users_s as replacement', 'ar.replacement_user_id', '=', 'replacement.id')
                ->whereIn('ar.action_type', ['auto_replacement', 'manual_replacement'])
                ->where('ar.date', '>=', $startDate)
                ->where('ar.date', '<=', $endDate)
                ->select([
                    'ar.date',
                    'r.name as hall_name',
                    'original.name as original_user',
                    'replacement.name as replacement_user',
                    'ar.reason',
                    'ar.action_type',
                    'original.type as user_type'
                ])
                ->orderBy('ar.date', 'desc')
                ->get()
                ->map(function ($replacement) {
                    return [
                        'date' => $replacement->date,
                        'hallName' => $replacement->hall_name,
                        'originalUser' => $replacement->original_user,
                        'replacementUser' => $replacement->replacement_user ?? 'غير محدد',
                        'reason' => $replacement->reason ?? 'غير محدد',
                        'type' => $replacement->action_type === 'auto_replacement' ? 'تلقائي' : 'يدوي',
                        'userType' => $replacement->user_type === 'supervisor' ? 'مشرف' : 'ملاحظ',
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
            Log::info('=== بداية تحميل التقرير الشهري ===');

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
            $monthNames = [
                1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
                5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
                9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
            ];

            for ($month = 1; $month <= 12; $month++) {
                try {
                    $startDate = sprintf('%d-%02d-01', $year, $month);
                    $endDate = sprintf('%d-%02d-%02d', $year, $month, cal_days_in_month(CAL_GREGORIAN, $month, $year));

                    // عدد أيام المشرفين
                    $supervisorDays = DB::table('public.daily_assignments')
                        ->where('assignment_date', '>=', $startDate)
                        ->where('assignment_date', '<=', $endDate)
                        ->whereNotNull('supervisor_id')
                        ->count();

                    // عدد أيام الملاحظين
                    $observerDays = DB::table('public.daily_assignments')
                        ->where('assignment_date', '>=', $startDate)
                        ->where('assignment_date', '<=', $endDate)
                        ->whereNotNull('observer_ids')
                        ->get()
                        ->sum(function($assignment) {
                            $observerIds = json_decode($assignment->observer_ids, true);
                            return is_array($observerIds) ? count($observerIds) : 0;
                        });

                    // عدد الامتحانات
                    $totalExams = DB::table('public.daily_assignments')
                        ->where('assignment_date', '>=', $startDate)
                        ->where('assignment_date', '<=', $endDate)
                        ->distinct()
                        ->count(DB::raw('CONCAT(assignment_date, period)'));

                    $monthlyData[] = [
                        'month' => sprintf('%02d', $month),
                        'monthName' => $monthNames[$month],
                        'supervisorDays' => $supervisorDays,
                        'observerDays' => (int)$observerDays,
                        'totalExams' => $totalExams,
                    ];
                } catch (\Exception $e) {
                    Log::warning('خطأ في حساب بيانات الشهر ' . $month . ': ' . $e->getMessage());
                    $monthlyData[] = [
                        'month' => sprintf('%02d', $month),
                        'monthName' => $monthNames[$month],
                        'supervisorDays' => 0,
                        'observerDays' => 0,
                        'totalExams' => 0,
                    ];
                }
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

    // =============== Helper Methods ===============

    /**
     * تنفيذ استعلام بشكل آمن مع معالجة الأخطاء
     */
    private function safeCount($callback)
    {
        try {
            return $callback();
        } catch (\Exception $e) {
            Log::warning('خطأ في الاستعلام: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * الحصول على أكثر القاعات استخداماً
     */
    private function getMostUsedHall($startDate, $endDate)
    {
        try {
            $result = DB::table('public.daily_assignments as da')
                ->join('public.rooms as r', 'da.room_id', '=', 'r.id')
                ->select('r.name', DB::raw('count(*) as usage_count'))
                ->where('da.assignment_date', '>=', $startDate)
                ->where('da.assignment_date', '<=', $endDate)
                ->groupBy('r.id', 'r.name')
                ->orderBy('usage_count', 'desc')
                ->first();

            return $result ? $result->name : 'غير محدد';
        } catch (\Exception $e) {
            Log::warning('خطأ في الحصول على أكثر القاعات استخداماً: ' . $e->getMessage());
            return 'غير محدد';
        }
    }

    /**
     * الحصول على أكثر المشرفين نشاطاً
     */
    private function getMostActiveSupervisor($startDate, $endDate)
    {
        try {
            $result = DB::table('public.daily_assignments as da')
                ->join('public.users_s as u', 'da.supervisor_id', '=', 'u.id')
                ->select('u.name', DB::raw('count(*) as assignment_count'))
                ->where('da.assignment_date', '>=', $startDate)
                ->where('da.assignment_date', '<=', $endDate)
                ->whereNotNull('da.supervisor_id')
                ->groupBy('u.id', 'u.name')
                ->orderBy('assignment_count', 'desc')
                ->first();

            return $result ? $result->name : 'غير محدد';
        } catch (\Exception $e) {
            Log::warning('خطأ في الحصول على أكثر المشرفين نشاطاً: ' . $e->getMessage());
            return 'غير محدد';
        }
    }
}