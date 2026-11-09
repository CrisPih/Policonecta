<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\ImageStorage;
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
            'is_featured'      => 'nullable|boolean',
            'featured_until'   => 'nullable|date|before:2100-01-01',
            'sponsor'          => 'nullable|string|max:150',
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
        $validated['is_featured'] = $request->boolean('is_featured');

        if ($request->hasFile('image')) {
            $validated['image'] = ImageStorage::store($request->file('image'));
        }

        $event = Event::create($validated);

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
        ]);

        $query = Event::query();

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

        if ($request->filled('search')) {
            $search = $request->search;
            $like = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

            $query->where(function ($q) use ($search, $like) {
                $q->where('title', $like, "%{$search}%")
                  ->orWhere('description', $like, "%{$search}%");
            });
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

        $events = Event::query()
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
        $event = Event::find($id);

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
        ]);
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
            'is_featured'      => 'sometimes|boolean',
            'featured_until'   => 'sometimes|nullable|date|before:2100-01-01',
            'sponsor'          => 'sometimes|nullable|string|max:150',
        ]);

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

        $event->update($validated);

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