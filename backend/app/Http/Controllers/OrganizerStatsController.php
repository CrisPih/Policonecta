<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Payment;
use App\Models\Rating;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\Request;

// Tablero de metricas del organizador: inscripcion, asistencia, valoracion e ingresos
class OrganizerStatsController extends Controller
{
    // GET /api/organizer/stats
    public function index(Request $request)
    {
        $user = $request->user();

        $eventos = Event::where('user_id', $user->id)
            ->where('status', 'published')
            ->orderBy('start_date')
            ->get();

        $ids = $eventos->pluck('id');

        $inscripciones = Registration::whereIn('event_id', $ids)->get();
        $valoraciones = Rating::whereIn('event_id', $ids)->get();
        $pagos = Payment::whereIn('event_id', $ids)->where('status', 'aprobado')->get();

        $porEvento = $eventos->map(function (Event $event) use ($inscripciones, $valoraciones, $pagos) {
            $inscritos = $inscripciones->where('event_id', $event->id);
            $asistentes = $inscritos->whereNotNull('attended_at')->count();
            $notas = $valoraciones->where('event_id', $event->id);

            return [
                'id'              => $event->id,
                'title'           => $event->title,
                'type'            => $event->type,
                'start_date'      => $event->start_date,
                'registered'      => $inscritos->count(),
                'attended'        => $asistentes,
                'attendance_rate' => $inscritos->count() ? round($asistentes * 100 / $inscritos->count()) : null,
                'rating_average'  => $notas->count() ? round($notas->avg('rating'), 1) : null,
                'rating_count'    => $notas->count(),
                'ticket_income'   => round($pagos->where('event_id', $event->id)->where('concept', 'entrada')->sum('amount'), 2),
                'is_featured'     => $event->is_featured,
                'featured_until'  => $event->featured_until,
            ];
        })->values();

        // Segmentacion por facultad y carrera de los participantes con cuenta
        $usuarios = User::whereIn('email', $inscripciones->pluck('email')->unique())->get()->keyBy('email');

        $segmentar = function (string $campo) use ($inscripciones, $usuarios) {
            return $inscripciones
                ->groupBy(fn ($r) => optional($usuarios->get($r->email))->{$campo} ?: 'Sin dato')
                ->map(fn ($grupo, $nombre) => [
                    'name'       => $nombre,
                    'registered' => $grupo->count(),
                    'attended'   => $grupo->whereNotNull('attended_at')->count(),
                ])
                ->sortByDesc('registered')
                ->values();
        };

        $comentarios = Rating::with(['user:id,name', 'event:id,title'])
            ->whereIn('event_id', $ids)
            ->whereNotNull('comment')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $totalInscritos = $inscripciones->count();
        $totalAsistentes = $inscripciones->whereNotNull('attended_at')->count();

        return response()->json([
            'message' => 'Estadísticas consultadas correctamente.',
            'totals'  => [
                'events'          => $eventos->count(),
                'registered'      => $totalInscritos,
                'attended'        => $totalAsistentes,
                'attendance_rate' => $totalInscritos ? round($totalAsistentes * 100 / $totalInscritos) : null,
                'rating_average'  => $valoraciones->count() ? round($valoraciones->avg('rating'), 1) : null,
                'ticket_income'   => round($pagos->where('concept', 'entrada')->sum('amount'), 2),
                'featured_spent'  => round($pagos->where('concept', 'destacado')->sum('amount'), 2),
            ],
            'events'     => $porEvento,
            'by_faculty' => $segmentar('faculty'),
            'by_career'  => $segmentar('career'),
            'comments'   => $comentarios,
        ]);
    }
}
