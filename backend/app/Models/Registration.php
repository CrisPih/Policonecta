<?php

// Modelo de inscripcion a un evento -- Cristina Pihuave

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Registration extends Model
{
    // Puntos que recibe el participante por cada asistencia verificada
    public const PUNTOS_ASISTENCIA = 10;

    protected $fillable = [
        'event_id',
        'name',
        'email',
        'payment_id',
        'qr_token',
        'attended_at',
    ];

    // El codigo QR solo se entrega a su titular
    protected $hidden = ['qr_token'];

    protected $casts = [
        'attended_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Registration $registration) {
            if (empty($registration->qr_token)) {
                $registration->qr_token = Str::random(32);
            }
        });
    }

    // Contenido del codigo QR de la credencial
    public function qrContent(): string
    {
        return "POLICONECTA:{$this->event_id}:{$this->qr_token}";
    }

    // Cada inscripcion pertenece a un evento
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
