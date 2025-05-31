<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AbsenceReplacement extends Model
{
    use HasFactory;

    protected $table = 'public.absence_replacements';

    protected $fillable = [
        'date',
        'room_id',
        'original_user_id',
        'replacement_user_id',
        'action_type',
        'reason',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    // العلاقة مع القاعة
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    // العلاقة مع المستخدم الأصلي
    public function originalUser()
    {
        return $this->belongsTo(Users_s::class, 'original_user_id');
    }

    // العلاقة مع المستخدم البديل
    public function replacementUser()
    {
        return $this->belongsTo(Users_s::class, 'replacement_user_id');
    }

    // دالة لتحديد ما إذا كان النوع غياب
    public function isAbsence()
    {
        return $this->action_type === 'absence';
    }

    // دالة لتحديد ما إذا كان النوع استبدال تلقائي
    public function isAutoReplacement()
    {
        return $this->action_type === 'auto_replacement';
    }

    // دالة لتحديد ما إذا كان النوع استبدال يدوي
    public function isManualReplacement()
    {
        return $this->action_type === 'manual_replacement';
    }
}

// إضافة العلاقة المفقودة في Users_s Model
// يجب إضافة هذا للملف Users_s.php:

/*
    // العلاقة مع الغيابات والاستبدالات (كمستخدم أصلي)
    public function absences()
    {
        return $this->hasMany(AbsenceReplacement::class, 'original_user_id');
    }
*/
