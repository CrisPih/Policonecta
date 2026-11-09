<?php

// Registro y cancelacion de participacion en eventos -- Cristina Pihuave

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\Request;

class RegistrationController extends Controller
{
    // GET /api/registrations?email=
    // Lista las inscripciones de un participante, con los datos de cada evento
    public function byParticipant(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $registrations = Registration::with('event')
            ->where('email', $validated['email'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Inscripciones consultadas correctamente.',
            'total' => $registrations->count(),
            'registrations' => $registrations,
        ]);
    }

    // GET /api/events/{event}/registrations
    // Lista los participantes inscritos en un evento
    public function index($eventId)
    {
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json([
                'message' => 'Evento no encontrado.'
            ], 404);
        }

        $registrations = $event->registrations()
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'message' => 'Participantes consultados correctamente.',
            'event_id' => $event->id,
            'registered_participants' => $registrations->count(),
            'available_spots' => $event->availableSpots(),
            'registrations' => $registrations,
        ]);
    }

    // POST /api/events/{event}/registrations
    // Inscribe a un participante validando que existan cupos
    public function store(Request $request, $eventId)
    {
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json([
                'message' => 'Evento no encontrado.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
        ]);

        // Un mismo correo no puede inscribirse dos veces al mismo evento
        $alreadyRegistered = $event->registrations()
            ->where('email', $validated['email'])
            ->exists();

        if ($alreadyRegistered) {
            return response()->json([
                'message' => 'Este correo ya se encuentra inscrito en el evento.'
            ], 409);
        }

        // Control automatico de disponibilidad de cupos
        $libres = $event->availableSpots();
        if ($libres !== null && $libres <= 0) {
            return response()->json([
                'message' => 'No hay cupos disponibles para este evento.',
                'available_spots' => 0,
            ], 409);
        }

        $registration = $event->registrations()->create($validated);

        return response()->json([
            'message' => 'Participación registrada correctamente.',
            'registration' => $registration,
            'available_spots' => $event->availableSpots(),
        ], 201);
    }

    // DELETE /api/events/{event}/registrations/{registration}
    // Cancela la participacion de un inscrito
    public function destroy($eventId, $registrationId)
    {
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json([
                'message' => 'Evento no encontrado.'
            ], 404);
        }

        $registration = Registration::where('event_id', $event->id)
            ->find($registrationId);

        if (!$registration) {
            return response()->json([
                'message' => 'Inscripción no encontrada.'
            ], 404);
        }

        $registration->delete();

        return response()->json([
            'message' => 'Participación cancelada correctamente.',
            'available_spots' => $event->availableSpots(),
        ]);
    }
}
