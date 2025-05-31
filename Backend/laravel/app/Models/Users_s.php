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

    protected $casts = [
        'last_absence_date' => 'date',
        'consecutive_absence_days' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // إعدادات إضافية للتأكد من عمل الModel
    protected $connection = 'pgsql'; // تأكيد استخدام PostgreSQL

    // تعطيل timestamps إذا لم تكن موجودة في الجدول
    public $timestamps = true;

    // العلاقة مع التوزيعات كمشرف
    public function supervisorDailyAssignments()
    {
        return $this->hasMany(DailyAssignment::class, 'supervisor_id');
    }

    // العلاقة مع التوزيعات كملاحظ
    public function observerDailyAssignments()
    {
        return $this->belongsToMany(DailyAssignment::class, 'public.DailyAssignment_observer', 'users_s_id', 'DailyAssignment_id')
            ->withPivot('DailyAssignment_type')
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

    // دالة لتحديد ما إذا كان المستخدم نشط
    public function isActive()
    {
        return $this->status === 'active';
    }

    // دالة لتحديد ما إذا كان المستخدم معلق
    public function isSuspended()
    {
        return $this->status === 'suspended';
    }

    // دالة لتحديد ما إذا كان المستخدم محذوف
    public function isDeleted()
    {
        return $this->status === 'deleted';
    }

    // Scopes للاستعلامات الشائعة
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSupervisors($query)
    {
        return $query->where('type', 'supervisor');
    }

    public function scopeObservers($query)
    {
        return $query->where('type', 'observer');
    }

    public function scopeCollegeEmployees($query)
    {
        return $query->where('rank', 'college_employee');
    }

    public function scopeExternalEmployees($query)
    {
        return $query->where('rank', 'external_employee');
    }

    // إضافة mutators للتأكد من تنظيف البيانات
    public function setNameAttribute($value)
    {
        $this->attributes['name'] = trim($value);
    }

    public function setSpecializationAttribute($value)
    {
        $this->attributes['specialization'] = trim($value);
    }

    public function setPhoneAttribute($value)
    {
        $this->attributes['phone'] = trim($value);
    }

    public function setWhatsappAttribute($value)
    {
        $this->attributes['whatsapp'] = trim($value);
    }
}
