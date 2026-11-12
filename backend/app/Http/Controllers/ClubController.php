<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\Event;

// Clubes estudiantiles y sus publicaciones
class ClubController extends Controller
{
    // GET /api/clubs
    public function index()
    {
        $hoy = now()->toDateString();

        $clubes = Club::query()
            ->withCount(['events as upcoming_events_count' => function ($q) use ($hoy) {
                $q->where('status', 'published')
                  ->where(function ($q2) use ($hoy) {
                      $q2->whereDate('end_date', '>=', $hoy)->orWhereDate('start_date', '>=', $hoy);
                  });
            }])
            ->orderBy('name')
            ->get();

        return response()->json([
            'message' => 'Clubes consultados correctamente.',
            'clubs'   => $clubes,
        ]);
    }

    // GET /api/clubs/{club}
    public function show($id)
    {
        $club = Club::find($id);

        if (!$club) {
            return response()->json(['message' => 'Club no encontrado.'], 404);
        }

        $eventos = Event::with('club:id,name,acronym')
            ->where('club_id', $club->id)
            ->where('status', 'published')
            ->withCount('registrations')
            ->orderBy('start_date')
            ->get();

        Event::addSpots($eventos);

        return response()->json([
            'message' => 'Club consultado correctamente.',
            'club'    => $club,
            'events'  => $eventos,
        ]);
    }
}
