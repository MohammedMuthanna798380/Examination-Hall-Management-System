<?php
// Backend/laravel/app/Models/DailyAssignment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DailyAssignment extends Model
{
    use HasFactory;

    protected $table = 'public.daily_assignments';

    protected $fillable = [
        'assignment_date',
        'period',
        'room_id',
        'supervisor_id',
        'observer_ids',
        'status',
        'assignment_type',
        'notes',
    ];

    protected $casts = [
        'assignment_date' => 'date',
        'observer_ids' => 'array',
    ];

    // العلاقة مع القاعة
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    // العلاقة مع المشرف
    public function supervisor()
    {
        return $this->belongsTo(Users_s::class, 'supervisor_id');
    }

    // الحصول على الملاحظين
    public function observers()
    {
        if (!$this->observer_ids || !is_array($this->observer_ids)) {
            return collect();
        }

        return Users_s::whereIn('id', $this->observer_ids)->get();
    }

    // دالة للحصول على التفاصيل الكاملة للتوزيع
    public function getFullDetails()
    {
        return [
            'id' => $this->id,
            'assignment_date' => $this->assignment_date->format('Y-m-d'),
            'period' => $this->period,
            'room' => [
                'id' => $this->room->id,
                'name' => $this->room->name,
                'building' => $this->room->floor->building->name,
                'floor' => $this->room->floor->name,
                'capacity' => $this->room->capacity,
                'required_supervisors' => $this->room->required_supervisors,
                'required_observers' => $this->room->required_observers,
            ],
            'supervisor' => $this->supervisor ? [
                'id' => $this->supervisor->id,
                'name' => $this->supervisor->name,
                'type' => $this->supervisor->type,
                'rank' => $this->supervisor->rank,
                'missing' => false,
            ] : [
                'id' => null,
                'name' => 'غير محدد',
                'type' => 'supervisor',
                'rank' => null,
                'missing' => true,
            ],
            'observers' => $this->observers()->map(function ($observer) {
                return [
                    'id' => $observer->id,
                    'name' => $observer->name,
                    'type' => $observer->type,
                    'rank' => $observer->rank,
                    'missing' => false,
                ];
            }),
            'status' => $this->status,
            'assignment_type' => $this->assignment_type,
            'notes' => $this->notes,
        ];
    }

    // دالة للتحقق من اكتمال التوزيع
    public function isComplete()
    {
        return $this->status === 'complete';
    }

    // دالة للتحقق من التوزيع الجزئي
    public function isPartial()
    {
        return $this->status === 'partial';
    }

    // دالة للتحقق من التوزيع غير المكتمل
    public function isIncomplete()
    {
        return $this->status === 'incomplete';
    }

    // دالة للتحقق من التوزيع التلقائي
    public function isAutomatic()
    {
        return $this->assignment_type === 'automatic';
    }

    // دالة للتحقق من التوزيع اليدوي
    public function isManual()
    {
        return $this->assignment_type === 'manual';
    }

    // Scopes للاستعلامات المشتركة

    public function scopeForDate($query, $date)
    {
        return $query->where('assignment_date', $date);
    }

    public function scopeForPeriod($query, $period)
    {
        return $query->where('period', $period);
    }

    public function scopeForDateAndPeriod($query, $date, $period)
    {
        return $query->where('assignment_date', $date)
            ->where('period', $period);
    }

    public function scopeWithSupervisor($query)
    {
        return $query->whereNotNull('supervisor_id');
    }

    public function scopeWithObservers($query)
    {
        return $query->whereNotNull('observer_ids');
    }

    public function scopeComplete($query)
    {
        return $query->where('status', 'complete');
    }

    public function scopeIncomplete($query)
    {
        return $query->where('status', 'incomplete');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopeAutomatic($query)
    {
        return $query->where('assignment_type', 'automatic');
    }

    public function scopeManual($query)
    {
        return $query->where('assignment_type', 'manual');
    }

    // دوال مساعدة إضافية

    /**
     * الحصول على عدد الملاحظين المعينين
     */
    public function getAssignedObserversCount()
    {
        return $this->observer_ids ? count($this->observer_ids) : 0;
    }

    /**
     * التحقق من وجود مشرف معين
     */
    public function hasSupervisor($supervisorId)
    {
        return $this->supervisor_id == $supervisorId;
    }

    /**
     * التحقق من وجود ملاحظ معين
     */
    public function hasObserver($observerId)
    {
        return $this->observer_ids && in_array($observerId, $this->observer_ids);
    }

    /**
     * إضافة ملاحظ للتوزيع
     */
    public function addObserver($observerId)
    {
        $observerIds = $this->observer_ids ?? [];

        if (!in_array($observerId, $observerIds)) {
            $observerIds[] = $observerId;
            $this->observer_ids = $observerIds;
            $this->save();
        }
    }

    /**
     * إزالة ملاحظ من التوزيع
     */
    public function removeObserver($observerId)
    {
        $observerIds = $this->observer_ids ?? [];

        $key = array_search($observerId, $observerIds);
        if ($key !== false) {
            unset($observerIds[$key]);
            $this->observer_ids = array_values($observerIds);
            $this->save();
        }
    }

    /**
     * استبدال ملاحظ بآخر
     */
    public function replaceObserver($oldObserverId, $newObserverId)
    {
        $observerIds = $this->observer_ids ?? [];

        $key = array_search($oldObserverId, $observerIds);
        if ($key !== false) {
            $observerIds[$key] = $newObserverId;
            $this->observer_ids = $observerIds;
            $this->save();
        }
    }

    /**
     * الحصول على معلومات النقص في التوزيع
     */
    public function getDeficiencies()
    {
        $deficiencies = [];

        // فحص نقص المشرفين
        if (!$this->supervisor_id) {
            $deficiencies[] = [
                'type' => 'supervisor',
                'required' => $this->room->required_supervisors,
                'assigned' => 0,
                'missing' => $this->room->required_supervisors,
            ];
        }

        // فحص نقص الملاحظين
        $assignedObservers = $this->getAssignedObserversCount();
        $requiredObservers = $this->room->required_observers;

        if ($assignedObservers < $requiredObservers) {
            $deficiencies[] = [
                'type' => 'observer',
                'required' => $requiredObservers,
                'assigned' => $assignedObservers,
                'missing' => $requiredObservers - $assignedObservers,
            ];
        }

        return $deficiencies;
    }

    /**
     * تحديث حالة التوزيع بناءً على الاكتمال
     */
    public function updateStatus()
    {
        $deficiencies = $this->getDeficiencies();

        if (empty($deficiencies)) {
            $this->status = 'complete';
        } elseif ($this->supervisor_id || $this->getAssignedObserversCount() > 0) {
            $this->status = 'partial';
        } else {
            $this->status = 'incomplete';
        }

        $this->save();
    }
}
