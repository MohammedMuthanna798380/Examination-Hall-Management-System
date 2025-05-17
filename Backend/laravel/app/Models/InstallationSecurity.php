<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallationSecurity extends Model
{
    use HasFactory;

    protected $table = 'system.installation_security';

    protected $fillable = [
        'installation_key',
        'license_id',
        'hardware_fingerprint',
        'installation_date',
        'installation_password_hash',
        'is_valid',
    ];

    protected $casts = [
        'installation_date' => 'datetime',
        'is_valid' => 'boolean',
    ];

    // العلاقة مع الترخيص
    public function license()
    {
        return $this->belongsTo(License::class);
    }

    // دالة لتحديد ما إذا كان التثبيت صالح
    public function isValid()
    {
        return $this->is_valid;
    }

    // دالة للتحقق من كلمة مرور التثبيت
    public function checkPassword($password)
    {
        return password_verify($password, $this->installation_password_hash);
    }
}
