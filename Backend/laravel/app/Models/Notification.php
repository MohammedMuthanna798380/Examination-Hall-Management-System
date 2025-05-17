<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'public.notifications';

    protected $fillable = [
        'date',
        'room_id',
        'deficiency_type',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    // العلاقة مع القاعة
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    // دالة لتحديد ما إذا كان النوع نقص مشرفين
    public function isSupervisorDeficiency()
    {
        return $this->deficiency_type === 'supervisor';
    }

    // دالة لتحديد ما إذا كان النوع نقص ملاحظين
    public function isObserverDeficiency()
    {
        return $this->deficiency_type === 'observer';
    }

    // دالة لتحديد ما إذا كانت الحالة تمت معالجتها
    public function isResolved()
    {
        return $this->status === 'resolved';
    }

    // دالة لتحديد ما إذا كانت الحالة لم تتم معالجتها
    public function isUnresolved()
    {
        return $this->status === 'unresolved';
    }
}
