<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamSchedule extends Model
{
    use HasFactory;

    protected $table = 'public.exam_schedules';

    protected $fillable = [
        'date',
        'period',
        'distribution_status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    // العلاقة مع القاعات (many-to-many)
    public function rooms()
    {
        return $this->belongsToMany(Room::class, 'public.exam_schedule_room', 'exam_schedule_id', 'room_id')
            ->withTimestamps();
    }

    // العلاقة مع التوزيعات
    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'date', 'date')
            ->where('period', $this->period);
    }

    // دالة لتحديد ما إذا كان التوزيع مكتمل
    public function isDistributionComplete()
    {
        return $this->distribution_status === 'complete';
    }

    // دالة لتحديد ما إذا كان التوزيع غير مكتمل
    public function isDistributionIncomplete()
    {
        return $this->distribution_status === 'incomplete';
    }

    // دالة لتحديد ما إذا كان التوزيع جزئي
    public function isDistributionPartial()
    {
        return $this->distribution_status === 'partial';
    }

    // دالة للحصول على القاعات مع تفاصيل المبنى والدور
    public function getRoomsWithDetails()
    {
        return $this->rooms()->with(['floor.building'])->get()->map(function ($room) {
            return [
                'id' => $room->id,
                'name' => $room->name,
                'building_name' => $room->floor->building->name,
                'floor_name' => $room->floor->name,
                'capacity' => $room->capacity,
                'required_supervisors' => $room->required_supervisors,
                'required_observers' => $room->required_observers,
            ];
        });
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->where('date', $date);
    }

    public function scopeByPeriod($query, $period)
    {
        return $query->where('period', $period);
    }

    public function scopeIncomplete($query)
    {
        return $query->whereIn('distribution_status', ['incomplete', 'partial']);
    }

    // دالة لحساب إجمالي المتطلبات
    public function getTotalRequirements()
    {
        $rooms = $this->rooms;
        return [
            'total_supervisors' => $rooms->sum('required_supervisors'),
            'total_observers' => $rooms->sum('required_observers'),
            'total_rooms' => $rooms->count(),
        ];
    }
}
