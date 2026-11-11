<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Aviso dentro de la plataforma para un usuario
class UserNotification extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'kind',
        'title',
        'body',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
