<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    use HasFactory;

    protected $table = 'public.buildings';

    protected $fillable = [
        'name',
    ];

    // العلاقة مع الأدوار
    public function floors()
    {
        return $this->hasMany(Floor::class);
    }

    // العلاقة مع القاعات (عبر الأدوار)
    public function rooms()
    {
        return $this->hasManyThrough(Room::class, Floor::class);
    }
}
