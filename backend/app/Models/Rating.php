<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Valoracion de un evento por un asistente
class Rating extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
