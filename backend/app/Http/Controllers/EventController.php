<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\ImageStorage;
use App\Services\Notificador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    // Creación de eventos -- Dhamar Patiño

    // POST /api/events
    public function store(Request $request)
    {
        $isDraft = $request->input('status') === 'draft';
        // Las pasantias, becas y convocatorias no exigen horario, lugar ni cupos
        $isOpportunity = $request->filled('type') && $request->input('type') !== 'evento';
        $loose = $isDraft || $isOpportunity;

        $rules = [
            'user_id'          => 'nullable|integer',
            'title'            => 'required|string|max:255',
            'description'      => $isDraft ? 'nullable|string' : 'required|string',
            'category'         => $isDraft ? 'nullable|string|max:100' : 'required|string|max:100',
            'modality'         => $loose ? 'nullable|string|max:50' : 'required|string|max:50',
            'faculty'          => $isDraft ? 'nullable|string|max:100' : 'required|string|max:100',
            // Se limita el rango de fechas para evitar errores de tipeo en el año
            'start_date'       => ($isDraft ? 'nullable|date' : 'required|date') . '|before:2100-01-01',
            'end_date'         => 'nullable|date|after_or_equal:start_date|before:2100-01-01',
            'start_time'       => $loose ? 'nullable|date_format:H:i,H:i:s' : 'required|date_format:H:i,H:i:s',
            'end_time'         => 'nullable|date_format:H:i,H:i:s',
            'image'            => 'nullable',
            'location'         => $loose ? 'nullable|string|max:255' : 'required|string|max:255',
            'max_participants' => $loose ? 'nullable|integer|min:1' : 'required|integer|min:1',
            'status'           => 'nullable|string|in:draft,published',
            'type'             => 'nullable|string|in:' . implode(',', Event::TYPES),
            'deadline'         => ($isOpportunity && !$isDraft ? 'required|date' : 'nullable|date') . '|before:2100-01-01',
            'external_link'    => 'nullable|url|max:500',
            'price'            => 'nullable|numeric|min:0|max:10000',
            'club_id'          => 'nullable|integer|exists:clubs,id',
            'external_organizer' => 'nullable|string|max:150',
            'tags'             => 'nullable|array|max:15',
            'tags.*'           => 'nullable|string|max:40',
        ];

        $validated = $request->validate($rules);

        if ($request->user()) {
            $validated['user_id'] = $request->user()->id;
        } elseif ($request->filled('user_id')) {
            $validated['user_id'] = $request->input('user_id');
        }

        if (empty($validated['end_date']) && !empty($validated['start_date'])) {
            $validated['end_date'] = $validated['start_date'];
        }

        $validated['status'] = $request->input('status', 'published');
        $validated['type'] = $validated['type'] ?? 'evento';
        $validated['tags'] = self::limpiarTags($validated['tags'] ?? null);

        if ($request->hasFile('image')) {
            $validated['image'] = ImageStorage::store($request->file('image'));
        }

        $event = Event::create($validated);

        Notificador::nuevaPublicacion($event);

        return response()->json([
            'message' => $isDraft ? 'Borrador guardado correctamente.' : 'Evento creado correctamente.',
            'event'   => $event
        ], 201);
    }

    // Consulta, búsqueda y filtrado de eventos -- Dhamar Patiño

    // GET /api/events
    public function index(Request $request)
    {
        $request->validate([
            'search'   => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'date'     => 'nullable|date',
            'faculty'  => 'nullable|string|max:100',
            'status'   => 'nullable|string|in:draft,published',
            'user_id'  => 'nullable|integer',
            'type'     => 'nullable|string|in:' . implode(',', Event::TYPES),
            'kind'     => 'nullable|string|in:eventos,oportunidades',
            'club_id'  => 'nullable|integer',
            'origin'   => 'nullable|string|in:facultad,club,externo',
        ]);

        $query = Event::query()->with('club:id,name,acronym');

        // Quien organiza: facultad o unidad, club estudiantil u organizacion externa
        if ($request->filled('club_id')) {
            $query->where('club_id', $request->club_id);
        }
        if ($request->origin === 'club') {
            $query->whereNotNull('club_id');
        } elseif ($request->origin === 'externo') {
            $query->whereNotNull('external_organizer');
        } elseif ($request->origin === 'facultad') {
            $query->whereNull('club_id')->whereNull('external_organizer');
        }

        // Filtro por tipo de publicacion
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        } elseif ($request->kind === 'eventos') {
            $query->where('type', 'evento');
        } elseif ($request->kind === 'oportunidades') {
            $query->where('type', '!=', 'evento');
        }

        // Si se pasa user_id se filtra por usuario
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Si se pide un status específico (draft o published)
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else if (!$request->filled('user_id')) {
            // Solo restringir a 'published' en la vista pública si no están filtrando por su usuario
            $query->where('status', 'published');
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('date')) {
            $filterDate = $request->date;
            $query->whereDate('start_date', '<=', $filterDate)
                  ->whereDate('end_date', '>=', $filterDate);
        }

        if ($request->filled('faculty')) {
            $query->where('faculty', $request->faculty);
        }

        $events = $query
            ->withCount('registrations')
            ->orderBy('start_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        // La busqueda considera titulo, descripcion, palabras clave, club y organizador externo
        if ($request->filled('search')) {
            $buscado = mb_strtolower(trim($request->search));
            $events = $events->filter(function (Event $e) use ($buscado) {
                $texto = mb_strtolower(implode(' ', array_filter([
                    $e->title,
                    $e->description,
                    implode(' ', $e->tags ?? []),
                    optional($e->club)->name,
                    optional($e->club)->acronym,
                    $e->external_organizer,
                ])));

                return str_contains($texto, $buscado);
            })->values();
        }

        // Cada evento incluye sus cupos para mostrarlos en el catalogo -- Cristina Pihuave
        Event::addSpots($events);

        return response()->json([
            'message' => 'Eventos consultados correctamente.',
            'events'  => $events
        ]);
    }

    // Publicaciones destacadas para el carrusel del inicio

    // GET /api/events/featured
    public function featured()
    {
        $today = now()->toDateString();

        $events = Event::query()->with('club:id,name,acronym')
            ->where('status', 'published')
            ->where('is_featured', true)
            ->where(function ($q) use ($today) {
                $q->whereNull('featured_until')->orWhereDate('featured_until', '>=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereDate('end_date', '>=', $today)
                  ->orWhereDate('deadline', '>=', $today)
                  ->orWhere(function ($q2) {
                      $q2->whereNull('end_date')->whereNull('deadline');
                  });
            })
            ->withCount('registrations')
            ->orderBy('start_date', 'asc')
            ->limit(8)
            ->get();

        Event::addSpots($events);

        return response()->json([
            'message' => 'Publicaciones destacadas consultadas correctamente.',
            'events'  => $events,
        ]);
    }

    // GET /api/events/{id}
    public function show($id)
    {
        $event = Event::with('club:id,name,acronym')->find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Evento no encontrado.'
            ], 404);
        }

        return response()->json([
            'message'                 => 'Evento consultado correctamente.',
            'event'                   => $event,
            'registered_participants' => $event->registeredCount(),
            'available_spots'         => $event->availableSpots(),
            'rating_average'          => $event->ratings()->count() ? round($event->ratings()->avg('rating'), 1) : null,
            'rating_count'            => $event->ratings()->count(),
        ]);
    }

    // Detector de cruces: eventos publicados en el mismo horario
    // y dirigidos al mismo publico (misma facultad)

    // GET /api/events/conflicts
    public function conflicts(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i,H:i:s',
            'end_time'   => 'nullable|date_format:H:i,H:i:s',
            'faculty'    => 'nullable|string|max:100',
            'exclude_id' => 'nullable|integer',
        ]);

        $inicio = $validated['start_date'];
        $fin = $validated['end_date'] ?? $inicio;

        $candidatos = Event::query()
            ->where('status', 'published')
            ->where('type', 'evento')
            ->whereDate('start_date', '<=', $fin)
            ->where(function ($q) use ($inicio) {
                $q->whereDate('end_date', '>=', $inicio)
                  ->orWhere(fn ($q2) => $q2->whereNull('end_date')->whereDate('start_date', '>=', $inicio));
            })
            ->when($validated['exclude_id'] ?? null, fn ($q, $id) => $q->where('id', '!=', $id))
            ->when($validated['faculty'] ?? null, fn ($q, $f) => $q->where('faculty', $f))
            ->get();

        $desde = self::minutos($validated['start_time'] ?? null);
        $hasta = self::minutos($validated['end_time'] ?? null) ?? ($desde !== null ? $desde + 120 : null);

        $cruces = $candidatos->filter(function (Event $e) use ($desde, $hasta) {
            $otroDesde = self::minutos($e->start_time);
            if ($desde === null || $otroDesde === null) {
                return true;
            }
            $otroHasta = self::minutos($e->end_time) ?? $otroDesde + 120;

            return $desde < $otroHasta && $otroDesde < $hasta;
        })->values();

        return response()->json([
            'message'   => $cruces->isEmpty() ? 'Sin cruces de horario.' : 'Hay eventos en el mismo horario para el mismo público.',
            'conflicts' => $cruces->map->only(['id', 'title', 'faculty', 'start_date', 'start_time', 'end_time', 'location'])->values(),
        ]);
    }

    // Palabras clave sin espacios sobrantes ni repetidas
    private static function limpiarTags(?array $tags): ?array
    {
        $limpias = collect($tags ?? [])
            ->map(fn ($t) => trim((string) $t))
            ->filter()
            ->unique(fn ($t) => mb_strtolower($t))
            ->values()
            ->all();

        return $limpias ?: null;
    }

    // Convierte una hora HH:MM en minutos desde la medianoche
    private static function minutos(?string $hora): ?int
    {
        if (!$hora) {
            return null;
        }
        [$h, $m] = explode(':', $hora);

        return (int) $h * 60 + (int) $m;
    }

    // PUT / PATCH /api/events/{id}
    public function update(Request $request, $id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Evento no encontrado.'
            ], 404);
        }

        $validated = $request->validate([
            'user_id'          => 'sometimes|nullable|integer',
            'title'            => 'sometimes|required|string|max:255',
            'description'      => 'sometimes|nullable|string',
            'category'         => 'sometimes|nullable|string|max:100',
            'modality'         => 'sometimes|nullable|string|max:50',
            'faculty'          => 'sometimes|nullable|string|max:100',
            'start_date'       => 'sometimes|nullable|date|before:2100-01-01',
            'end_date'         => 'sometimes|nullable|date|after_or_equal:start_date|before:2100-01-01',
            'start_time'       => 'sometimes|nullable|date_format:H:i,H:i:s',
            'end_time'         => 'nullable|date_format:H:i,H:i:s',
            'image'            => 'nullable',
            'location'         => 'sometimes|nullable|string|max:255',
            'max_participants' => 'sometimes|nullable|integer|min:1',
            'status'           => 'sometimes|required|string|in:draft,published',
            'type'             => 'sometimes|nullable|string|in:' . implode(',', Event::TYPES),
            'deadline'         => 'sometimes|nullable|date|before:2100-01-01',
            'external_link'    => 'sometimes|nullable|url|max:500',
            'price'            => 'sometimes|nullable|numeric|min:0|max:10000',
            'club_id'          => 'sometimes|nullable|integer|exists:clubs,id',
            'external_organizer' => 'sometimes|nullable|string|max:150',
            'tags'             => 'sometimes|nullable|array|max:15',
            'tags.*'           => 'nullable|string|max:40',
        ]);

        if (array_key_exists('tags', $validated)) {
            $validated['tags'] = self::limpiarTags($validated['tags']);
        }

        if ($request->hasFile('image')) {
            $validated['image'] = ImageStorage::store($request->file('image'));
        }

        if (isset($validated['start_date']) && empty($validated['end_date']) && empty($event->end_date)) {
            $validated['end_date'] = $validated['start_date'];
        }

        // No se permite reducir los cupos por debajo de los inscritos -- Cristina Pihuave
        if (isset($validated['max_participants'])) {
            $registered = $event->registeredCount();

            if ($validated['max_participants'] < $registered) {
                return response()->json([
                    'message' => 'El máximo de participantes no puede ser menor a los inscritos actuales.',
                    'registered_participants' => $registered,
                ], 422);
            }
        }

        $eraBorrador = $event->status !== 'published';
        $event->update($validated);

        if ($eraBorrador && $event->status === 'published') {
            Notificador::nuevaPublicacion($event);
        }

        return response()->json([
            'message' => 'Evento actualizado correctamente.',
            'event'   => $event->fresh(),
        ]);
    }

    // DELETE /api/events/{id}
    public function destroy($id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Evento no encontrado.'
            ], 404);
        }

        $event->delete();

        return response()->json([
            'message' => 'Evento eliminado correctamente.'
        ]);
    }
}