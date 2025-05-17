<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class License extends Model
{
    use HasFactory;

    protected $table = 'system.licenses';

    protected $fillable = [
        'license_key',
        'hardware_id',
        'start_date',
        'expiry_date',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expiry_date' => 'date',
        'is_active' => 'boolean',
    ];

    // العلاقة مع مدير النظام
    public function creator()
    {
        return $this->belongsTo(UserAdmin::class, 'created_by');
    }

    // العلاقة مع أمان التثبيت
    public function installations()
    {
        return $this->hasMany(InstallationSecurity::class);
    }

    // دالة لتحديد ما إذا كان الترخيص نشط
    public function isActive()
    {
        return $this->is_active;
    }

    // دالة لتحديد ما إذا كان الترخيص منتهي
    public function isExpired()
    {
        return $this->expiry_date < now();
    }

    // دالة لتحديد المدة المتبقية للترخيص
    public function remainingDays()
    {
        return now()->diffInDays($this->expiry_date, false);
    }
}
