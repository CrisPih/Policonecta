<?php

// Modelo de inscripcion a un evento -- Cristina Pihuave

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'email',
    ];

    // Cada inscripcion pertenece a un evento
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
