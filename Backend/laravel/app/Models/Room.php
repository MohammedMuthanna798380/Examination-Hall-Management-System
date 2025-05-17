<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $table = 'public.rooms';

    protected $fillable = [
        'name',
        'floor_id',
        'capacity',
        'required_supervisors',
        'required_observers',
        'can_add_observer',
        'status',
    ];

    // العلاقة مع الدور
    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    // العلاقة مع المبنى (عبر الدور)
    public function building()
    {
        return $this->hasOneThrough(Building::class, Floor::class, 'id', 'id', 'floor_id', 'building_id');
    }

    // العلاقة مع جداول الامتحانات
    public function examSchedules()
    {
        return $this->belongsToMany(ExamSchedule::class, 'public.exam_schedule_room');
    }

    // العلاقة مع التوزيعات
    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    // العلاقة مع الغيابات والاستبدالات
    public function absenceReplacements()
    {
        return $this->hasMany(AbsenceReplacement::class);
    }

    // العلاقة مع الإشعارات
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // دالة لتحديد ما إذا كانت القاعة متاحة
    public function isAvailable()
    {
        return $this->status === 'available';
    }
}
