<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class UserA extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'system.user_a';

    protected $fillable = [
        'username',
        'password',
        'role',
        'active'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'active' => 'boolean',
        'password' => 'hashed',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // دالة لتحديد ما إذا كان المستخدم مدير
    public function isAdmin()
    {
        return $this->role === 'admin';
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
