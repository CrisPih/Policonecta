<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Payment;
use App\Services\PagoSimulado;
use Carbon\Carbon;
use Illuminate\Http\Request;

// Planes y pagos de publicaciones destacadas, e historial de pagos
class PaymentController extends Controller
{
    // GET /api/featured-plans
    public function plans()
    {
        $planes = collect(Payment::PLANES_DESTACADO)
            ->map(fn ($precio, $dias) => ['days' => $dias, 'price' => $precio])
            ->values();

        return response()->json([
            'message' => 'Planes consultados correctamente.',
            'plans'   => $planes,
        ]);
    }

    // POST /api/events/{event}/feature
    public function feature(Request $request, $eventId)
    {
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json(['message' => 'Evento no encontrado.'], 404);
        }

        if ((int) $event->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Solo el organizador de la publicación puede destacarla.'], 403);
        }

        if ($event->status !== 'published') {
            return response()->json(['message' => 'Publique la publicación antes de destacarla.'], 422);
        }

        $cierre = $event->deadline ?? $event->end_date ?? $event->start_date;
        if ($cierre && Carbon::parse($cierre)->lt(Carbon::today())) {
            return response()->json(['message' => 'La publicación ya finalizó.'], 422);
        }

        $validated = $request->validate([
            'plan_days' => 'required|integer|in:' . implode(',', array_keys(Payment::PLANES_DESTACADO)),
            'sponsor'   => 'nullable|string|max:150',
        ] + PagoSimulado::reglas());

        $dias = (int) $validated['plan_days'];
        $pago = PagoSimulado::cobrar($validated, Payment::PLANES_DESTACADO[$dias], 'destacado', $request->user()->id, $event->id, $dias);

        // Si ya estaba destacada, el plan se suma a la fecha vigente
        $vigente = $event->is_featured && $event->featured_until && Carbon::parse($event->featured_until)->gte(Carbon::today());
        $base = $vigente ? Carbon::parse($event->featured_until) : Carbon::today();

        $event->update([
            'is_featured'    => true,
            'featured_until' => $base->addDays($dias)->toDateString(),
            'sponsor'        => $validated['sponsor'] ?? $event->sponsor,
        ]);

        return response()->json([
            'message' => 'Pago aprobado. La publicación aparece en destacados.',
            'payment' => $pago,
            'event'   => $event->fresh(),
        ], 201);
    }

    // GET /api/payments
    public function index(Request $request)
    {
        $pagos = Payment::with('event:id,title')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'message'  => 'Pagos consultados correctamente.',
            'payments' => $pagos,
        ]);
    }
}
