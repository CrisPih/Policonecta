<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Pago simulado de una publicacion destacada o de una entrada
class Payment extends Model
{
    // Planes de publicacion destacada: dias => precio en USD
    public const PLANES_DESTACADO = [
        7  => 15.00,
        15 => 25.00,
        30 => 40.00,
    ];

    protected $fillable = [
        'user_id',
        'event_id',
        'concept',
        'plan_days',
        'amount',
        'currency',
        'status',
        'reference',
        'payer_name',
        'card_brand',
        'card_last4',
    ];

    protected $casts = [
        'amount' => 'float',
        'plan_days' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
