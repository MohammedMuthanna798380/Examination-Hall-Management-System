<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Floor extends Model
{
    use HasFactory;

    protected $table = 'public.floors';

    protected $fillable = [
        'name',
        'building_id',
    ];

    // العلاقة مع المبنى
    public function building()
    {
        return $this->belongsTo(Building::class);
    }

    // العلاقة مع القاعات
    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
