<?php

// Registro y cancelacion de participacion en eventos -- Cristina Pihuave

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Rating;
use App\Models\Registration;
use App\Models\RewardRedemption;
use App\Services\PagoSimulado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegistrationController extends Controller
{
    // GET /api/registrations?email=
    // Lista las inscripciones de un participante, con los datos de cada evento
    public function byParticipant(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $registrations = Registration::with(['event', 'payment'])
            ->where('email', $validated['email'])
            ->orderBy('created_at', 'desc')
            ->get();

        // La credencial QR solo se entrega al titular de la inscripcion
        $esTitular = $request->user() && strcasecmp($request->user()->email, $validated['email']) === 0;
        if ($esTitular) {
            $registrations->each(function (Registration $r) {
                $r->makeVisible('qr_token');
                $r->qr_content = $r->qrContent();
            });
        }

        // Indica si el participante ya valoro cada evento
        if ($request->user()) {
            $valorados = Rating::where('user_id', $request->user()->id)->pluck('event_id')->all();
            $registrations->each(fn ($r) => $r->rated = in_array($r->event_id, $valorados));
        }

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

        // Los eventos con precio se pagan con tarjeta o con un cupon de entrada gratis
        $pago = null;
        $cupon = null;
        if ($event->isPaid()) {
            if ($request->filled('coupon_code')) {
                $cupon = RewardRedemption::where('code', $request->input('coupon_code'))
                    ->where('user_id', optional($request->user())->id)
                    ->where('reward', 'entrada')
                    ->where('status', 'disponible')
                    ->first();

                if (!$cupon) {
                    return response()->json(['message' => 'El cupón no es válido o ya fue usado.'], 422);
                }
            } else {
                $datosPago = $request->validate(PagoSimulado::reglas());
                $pago = PagoSimulado::cobrar($datosPago, (float) $event->price, 'entrada', optional($request->user())->id, $event->id);
            }
        }

        $registration = $event->registrations()->create($validated + ['payment_id' => optional($pago)->id]);
        $registration->makeVisible('qr_token');
        $registration->qr_content = $registration->qrContent();

        if ($cupon) {
            $cupon->update(['status' => 'usado', 'used_at' => now(), 'registration_id' => $registration->id]);
        }

        return response()->json([
            'message' => $cupon
                ? 'Cupón aplicado. Su entrada quedó registrada sin costo.'
                : ($pago ? 'Pago aprobado. Su entrada quedó registrada.' : 'Participación registrada correctamente.'),
            'coupon' => $cupon,
            'registration' => $registration,
            'payment' => $pago,
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

        if ($registration->attended_at) {
            return response()->json([
                'message' => 'No se puede cancelar una inscripción con asistencia registrada.'
            ], 422);
        }

        // Una entrada pagada se reembolsa y un cupon usado vuelve a estar disponible
        $reembolso = false;
        $cuponDevuelto = false;
        DB::transaction(function () use ($registration, &$reembolso, &$cuponDevuelto) {
            if ($registration->payment && $registration->payment->status === 'aprobado') {
                $registration->payment->update(['status' => 'reembolsado']);
                $reembolso = true;
            }

            $cuponDevuelto = RewardRedemption::where('registration_id', $registration->id)
                ->update(['status' => 'disponible', 'used_at' => null, 'registration_id' => null]) > 0;

            $registration->delete();
        });

        return response()->json([
            'message' => $reembolso
                ? 'Participación cancelada. El pago fue reembolsado.'
                : ($cuponDevuelto ? 'Participación cancelada. Su cupón vuelve a estar disponible.' : 'Participación cancelada correctamente.'),
            'available_spots' => $event->availableSpots(),
        ]);
    }
}
