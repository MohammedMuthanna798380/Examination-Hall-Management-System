<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Users_s extends Model
{
    use HasFactory;

    protected $table = 'public.users_s';

    protected $fillable = [
        'name',
        'specialization',
        'phone',
        'whatsapp',
        'type',
        'rank',
        'status',
        'consecutive_absence_days',
        'last_absence_date'
    ];

    // العلاقة مع التوزيعات كمشرف
    public function supervisorAssignments()
    {
        return $this->hasMany(Assignment::class, 'supervisor_id');
    }

    // العلاقة مع التوزيعات كملاحظ
    public function observerAssignments()
    {
        return $this->belongsToMany(Assignment::class, 'public.assignment_observer', 'user_id', 'assignment_id')
            ->withPivot('assignment_type')
            ->withTimestamps();
    }

    // العلاقة مع الغيابات والاستبدالات (كمستخدم أصلي)
    public function absences()
    {
        return $this->hasMany(AbsenceReplacement::class, 'original_user_id');
    }

    // العلاقة مع الغيابات والاستبدالات (كمستخدم بديل)
    public function replacements()
    {
        return $this->hasMany(AbsenceReplacement::class, 'replacement_user_id');
    }

    // دالة لتحديد ما إذا كان المستخدم مشرف
    public function isSupervisor()
    {
        return $this->type === 'supervisor';
    }

    // دالة لتحديد ما إذا كان المستخدم ملاحظ
    public function isObserver()
    {
        return $this->type === 'observer';
    }

    // دالة لتحديد ما إذا كان المستخدم موظف كلية
    public function isCollegeEmployee()
    {
        return $this->rank === 'college_employee';
    }
}
