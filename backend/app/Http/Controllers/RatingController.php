<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Rating;
use App\Models\UserNotification;
use Illuminate\Http\Request;

// Valoracion de eventos por quienes asistieron
class RatingController extends Controller
{
    // GET /api/events/{event}/ratings
    public function index($eventId)
    {
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json(['message' => 'Evento no encontrado.'], 404);
        }

        $valoraciones = $event->ratings()->with('user:id,name')->orderByDesc('created_at')->get();

        return response()->json([
            'message' => 'Valoraciones consultadas correctamente.',
            'average' => $valoraciones->count() ? round($valoraciones->avg('rating'), 1) : null,
            'count'   => $valoraciones->count(),
            'ratings' => $valoraciones->take(20)->values(),
        ]);
    }

    // POST /api/events/{event}/ratings
    public function store(Request $request, $eventId)
    {
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json(['message' => 'Evento no encontrado.'], 404);
        }

        $user = $request->user();

        $asistio = $event->registrations()
            ->where('email', $user->email)
            ->whereNotNull('attended_at')
            ->exists();

        if (!$asistio) {
            return response()->json(['message' => 'Solo quienes asistieron pueden valorar el evento.'], 403);
        }

        $validated = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $valoracion = Rating::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $user->id],
            $validated
        );

        UserNotification::where('user_id', $user->id)
            ->where('event_id', $event->id)
            ->where('kind', 'valorar')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Gracias por su valoración.',
            'rating'  => $valoracion,
        ], 201);
    }
}
