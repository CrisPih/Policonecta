<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    // Tipos de publicacion admitidos
    public const TYPES = ['evento', 'pasantia', 'beca', 'investigacion', 'convocatoria'];

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category',
        'modality',
        'faculty',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'image',
        'location',
        'max_participants',
        'status',
        'type',
        'deadline',
        'external_link',
        'is_featured',
        'featured_until',
        'sponsor',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
    ];

    // Relación con el usuario organizador
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Inscripciones y control de cupos -- Cristina Pihuave

    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }

    public function registeredCount()
    {
        return $this->registrations()->count();
    }

    public function availableSpots()
    {
        // Sin limite de cupos
        if ($this->max_participants === null) {
            return null;
        }

        $libres = $this->max_participants - $this->registeredCount();
        return $libres < 0 ? 0 : $libres;
    }

    // Agrega inscritos y cupos libres a una coleccion cargada con withCount('registrations')
    public static function addSpots($events)
    {
        $events->each(function ($event) {
            $inscritos = $event->registrations_count ?? $event->registeredCount();
            $event->registered_participants = $inscritos;
            $event->available_spots = $event->max_participants === null
                ? null
                : max($event->max_participants - $inscritos, 0);
        });

        return $events;
    }
}
