<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    use HasFactory;

    protected $table = 'system.logs';

    protected $fillable = [
        'user_type',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'ip_address',
    ];

    // علاقة متعددة الأشكال مع المستخدم (UserA أو UserAdmin)
    public function user()
    {
        return $this->morphTo('user', 'user_type', 'user_id');
    }

    // العلاقة مع الكيان المتأثر (إذا كان موجودًا)
    public function entity()
    {
        if ($this->entity_type && $this->entity_id) {
            $entityClass = 'App\\Models\\' . $this->entity_type;
            return $entityClass::find($this->entity_id);
        }
        return null;
    }
}
