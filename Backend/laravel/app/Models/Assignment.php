<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $table = 'public.assignments';

    protected $fillable = [
        'date',
        'period',
        'room_id',
        'supervisor_id',
        'status',
        'assignment_type',
    ];

    protected $casts = [
        'date' => 'date',
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

    // العلاقة مع الملاحظين
    public function observers()
    {
        return $this->belongsToMany(Users_s::class, 'public.assignment_observer', 'assignment_id', 'Users_s_id')
            ->withPivot('assignment_type')
            ->withTimestamps();
    }

    // العلاقة مع الغيابات والاستبدالات
    public function absenceReplacements()
    {
        return $this->hasMany(AbsenceReplacement::class, 'room_id', 'room_id')
            ->where('date', $this->date);
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

    // دالة لتحديد ما إذا كان التوزيع يدوي
    public function isManual()
    {
        return $this->assignment_type === 'manual';
    }
}
