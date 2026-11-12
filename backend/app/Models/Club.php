<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Club u organizacion estudiantil reconocida por la ESPOL
class Club extends Model
{
    protected $fillable = [
        'name',
        'acronym',
        'faculty',
        'description',
    ];

    public function events()
    {
        return $this->hasMany(Event::class);
    }
}
