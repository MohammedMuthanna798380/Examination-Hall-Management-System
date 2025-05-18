<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class UserA extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

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
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];


    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
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

    public function getAuthIdentifierName()
    {
        return 'username';
    }
}
