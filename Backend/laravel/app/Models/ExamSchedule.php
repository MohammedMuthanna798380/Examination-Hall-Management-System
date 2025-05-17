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

    // العلاقة مع القاعات
    public function rooms()
    {
        return $this->belongsToMany(Room::class, 'public.exam_schedule_room');
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
}
