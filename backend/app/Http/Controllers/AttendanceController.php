<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\Request;

// Registro de asistencia mediante el codigo QR de la credencial
class AttendanceController extends Controller
{
    // POST /api/events/{event}/attendance
    public function store(Request $request, $eventId)
    {
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json(['message' => 'Evento no encontrado.'], 404);
        }

        if ((int) $event->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Solo el organizador puede registrar la asistencia.'], 403);
        }

        $validated = $request->validate(['code' => 'required|string|max:200']);
        $codigo = trim($validated['code']);
        $token = $codigo;

        if (preg_match('/^POLICONECTA:(\d+):([A-Za-z0-9]+)$/', $codigo, $partes)) {
            if ((int) $partes[1] !== $event->id) {
                return response()->json(['message' => 'El código pertenece a otra publicación.'], 422);
            }
            $token = $partes[2];
        }

        $registro = Registration::where('event_id', $event->id)->where('qr_token', $token)->first();

        if (!$registro) {
            return response()->json(['message' => 'El código no corresponde a ninguna inscripción de esta publicación.'], 404);
        }

        if ($registro->attended_at) {
            return response()->json([
                'message'      => "La asistencia de {$registro->name} ya estaba registrada.",
                'registration' => $registro,
            ], 409);
        }

        $registro->update(['attended_at' => now()]);

        // Puntos para el participante si tiene cuenta en la plataforma
        $participante = User::where('email', $registro->email)->first();
        if ($participante) {
            $participante->increment('points', Registration::PUNTOS_ASISTENCIA);
        }

        return response()->json([
            'message'       => "Asistencia registrada: {$registro->name}.",
            'registration'  => $registro->fresh(),
            'points_awarded'=> $participante ? Registration::PUNTOS_ASISTENCIA : 0,
            'attended'      => $event->registrations()->whereNotNull('attended_at')->count(),
        ]);
    }
}
