<?php
// Backend/laravel/app/Models/DailyAssignment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'notes'
    ];

    protected $casts = [
        'assignment_date' => 'date',
        'observer_ids' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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

    // دالة للحصول على الملاحظين
    public function observers()
    {
        if (!$this->observer_ids || empty($this->observer_ids)) {
            return collect([]);
        }

        return Users_s::whereIn('id', $this->observer_ids)->get();
    }

    // دالة لتحديد ما إذا كان التوزيع مكتمل
    public function isComplete()
    {
        return $this->status === 'complete';
    }

    // دالة لتحديد ما إذا كان التوزيع تلقائي
    public function isAutomatic()
    {
        return $this->assignment_type === 'automatic';
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->where('assignment_date', $date);
    }

    public function scopeByPeriod($query, $period)
    {
        return $query->where('period', $period);
    }

    public function scopeIncomplete($query)
    {
        return $query->whereIn('status', ['incomplete', 'partial']);
    }

    // دالة للحصول على تفاصيل التوزيع
    public function getFullDetails()
    {
        return [
            'id' => $this->id,
            'assignment_date' => $this->assignment_date->format('Y-m-d'),
            'period' => $this->period,
            'room' => $this->room ? [
                'id' => $this->room->id,
                'name' => $this->room->name,
                'building_name' => $this->room->floor->building->name,
                'floor_name' => $this->room->floor->name,
                'capacity' => $this->room->capacity,
                'required_supervisors' => $this->room->required_supervisors,
                'required_observers' => $this->room->required_observers,
            ] : null,
            'supervisor' => $this->supervisor ? [
                'id' => $this->supervisor->id,
                'name' => $this->supervisor->name,
                'type' => $this->supervisor->type,
                'rank' => $this->supervisor->rank,
            ] : null,
            'observers' => $this->observers()->map(function ($observer) {
                return [
                    'id' => $observer->id,
                    'name' => $observer->name,
                    'type' => $observer->type,
                    'rank' => $observer->rank,
                ];
            }),
            'status' => $this->status,
            'assignment_type' => $this->assignment_type,
            'notes' => $this->notes,
        ];
    }
}
