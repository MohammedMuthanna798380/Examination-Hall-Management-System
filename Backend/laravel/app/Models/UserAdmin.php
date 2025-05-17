<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class UserAdmin extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'system.user_admins';

    protected $fillable = [
        'username',
        'can_install_system',
        'can_manage_licenses',
        'installation_password',
        'active',
    ];

    protected $hidden = [
        'installation_password',
    ];

    // العلاقة مع التراخيص
    public function licenses()
    {
        return $this->hasMany(License::class, 'created_by');
    }

    // دالة لتحديد ما إذا كان المستخدم يمكنه تثبيت النظام
    public function canInstallSystem()
    {
        return $this->can_install_system;
    }

    // دالة لتحديد ما إذا كان المستخدم يمكنه إدارة التراخيص
    public function canManageLicenses()
    {
        return $this->can_manage_licenses;
    }

    // دالة لتحديد ما إذا كان المستخدم نشط
    public function isActive()
    {
        return $this->active;
    }

    // العلاقة مع السجلات
    public function logs()
    {
        return $this->morphMany(SystemLog::class, 'loggable');
    }
}
