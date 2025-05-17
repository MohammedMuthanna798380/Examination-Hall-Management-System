<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $table = 'system.settings';

    protected $fillable = [
        'key',
        'value',
    ];

    // دالة مساعدة للحصول على قيمة إعداد معين
    public static function getValue($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    // دالة مساعدة لتعيين قيمة إعداد معين
    public static function setValue($key, $value)
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
