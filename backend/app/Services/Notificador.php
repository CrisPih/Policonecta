<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use App\Models\UserNotification;
use Carbon\Carbon;

// Genera los avisos de la plataforma: nuevas publicaciones afines,
// recordatorios, cierres de postulacion y solicitudes de valoracion
class Notificador
{
    private const DIAS_RECORDATORIO = 2;
    private const DIAS_CIERRE = 3;

    // Avisa a los usuarios cuyo perfil coincide con una publicacion nueva
    public static function nuevaPublicacion(Event $event): void
    {
        if ($event->status !== 'published') {
            return;
        }

        $palabras = $event->keywords();

        User::query()
            ->where('role', 'user')
            ->get()
            ->filter(function (User $user) use ($event, $palabras) {
                $intereses = collect($user->interests ?? [])->map(fn ($i) => mb_strtolower(trim($i)));

                return ($user->faculty && $user->faculty === $event->faculty)
                    || $intereses->intersect($palabras)->isNotEmpty();
            })
            ->each(fn (User $user) => self::crear(
                $user->id,
                $event,
                'nueva',
                'Nueva publicación afín a su perfil',
                $event->title
            ));
    }

    // Genera los avisos que dependen de la fecha actual para un usuario
    public static function generarPendientes(User $user): void
    {
        $hoy = Carbon::today();

        $inscripciones = Registration::with('event')
            ->where('email', $user->email)
            ->get()
            ->filter(fn ($r) => $r->event !== null);

        foreach ($inscripciones as $registro) {
            $event = $registro->event;
            $inicio = $event->start_date ? Carbon::parse($event->start_date) : null;
            $fin = Carbon::parse($event->end_date ?? $event->start_date ?? $hoy);

            // Recordatorio de un evento inscrito que empieza pronto
            if ($inicio && $inicio->between($hoy, $hoy->copy()->addDays(self::DIAS_RECORDATORIO))) {
                self::crear($user->id, $event, 'recordatorio', 'Recordatorio de evento', $event->title . ' - ' . $inicio->format('d/m/Y'));
            }

            // Solicitud de valoracion para quien asistio a un evento terminado
            if ($registro->attended_at && $fin->lte($hoy)) {
                $yaValoro = $event->ratings()->where('user_id', $user->id)->exists();
                if (!$yaValoro) {
                    self::crear($user->id, $event, 'valorar', 'Valore el evento al que asistió', $event->title);
                }
            }
        }

        // Cierre proximo de oportunidades afines a sus intereses
        $intereses = collect($user->interests ?? []);
        if ($intereses->isEmpty()) {
            return;
        }

        Event::query()
            ->where('status', 'published')
            ->where('type', '!=', 'evento')
            ->whereNotNull('deadline')
            ->whereDate('deadline', '>=', $hoy->toDateString())
            ->whereDate('deadline', '<=', $hoy->copy()->addDays(self::DIAS_CIERRE)->toDateString())
            ->get()
            ->filter(fn ($e) => $intereses->contains($e->type) || $intereses->contains($e->category))
            ->each(fn ($e) => self::crear(
                $user->id,
                $e,
                'cierre',
                'La postulación cierra pronto',
                $e->title . ' - ' . Carbon::parse($e->deadline)->format('d/m/Y')
            ));
    }

    private static function crear(int $userId, Event $event, string $tipo, string $titulo, string $cuerpo): void
    {
        UserNotification::firstOrCreate(
            ['user_id' => $userId, 'event_id' => $event->id, 'kind' => $tipo],
            ['title' => $titulo, 'body' => mb_substr($cuerpo, 0, 500)]
        );
    }
}
