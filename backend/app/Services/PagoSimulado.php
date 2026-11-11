<?php

namespace App\Services;

use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Pasarela de pago simulada para el prototipo: no se conecta a ningun banco
// ni guarda el numero completo de la tarjeta.
class PagoSimulado
{
    // Tarjeta de prueba que siempre se rechaza
    public const TARJETA_RECHAZADA = '4000000000000002';

    // Reglas de validacion de los datos de la tarjeta
    public static function reglas(): array
    {
        return [
            'card_name'   => 'required|string|max:120',
            'card_number' => 'required|string|max:25',
            'card_expiry' => ['required', 'string', 'regex:/^(0[1-9]|1[0-2])\/\d{2}$/'],
            'card_cvv'    => 'required|digits_between:3,4',
        ];
    }

    public static function cobrar(array $datos, float $monto, string $concepto, ?int $userId, ?int $eventId, ?int $dias = null): Payment
    {
        $numero = preg_replace('/\D/', '', $datos['card_number']);

        if (strlen($numero) < 13 || strlen($numero) > 19 || !self::luhn($numero)) {
            throw ValidationException::withMessages(['card_number' => 'El número de tarjeta no es válido.']);
        }

        [$mes, $anio] = explode('/', $datos['card_expiry']);
        $vence = Carbon::createFromDate(2000 + (int) $anio, (int) $mes, 1)->endOfMonth();
        if ($vence->isPast()) {
            throw ValidationException::withMessages(['card_expiry' => 'La tarjeta está vencida.']);
        }

        if ($numero === self::TARJETA_RECHAZADA) {
            throw ValidationException::withMessages(['card_number' => 'El banco rechazó el pago.']);
        }

        return Payment::create([
            'user_id'    => $userId,
            'event_id'   => $eventId,
            'concept'    => $concepto,
            'plan_days'  => $dias,
            'amount'     => $monto,
            'status'     => 'aprobado',
            'reference'  => 'PC-' . now()->format('ymd') . '-' . Str::upper(Str::random(6)),
            'payer_name' => $datos['card_name'],
            'card_brand' => self::marca($numero),
            'card_last4' => substr($numero, -4),
        ]);
    }

    private static function luhn(string $numero): bool
    {
        $suma = 0;
        $doble = false;

        for ($i = strlen($numero) - 1; $i >= 0; $i--) {
            $digito = (int) $numero[$i];
            if ($doble) {
                $digito *= 2;
                if ($digito > 9) {
                    $digito -= 9;
                }
            }
            $suma += $digito;
            $doble = !$doble;
        }

        return $suma % 10 === 0;
    }

    private static function marca(string $numero): string
    {
        return match (true) {
            str_starts_with($numero, '4') => 'Visa',
            (bool) preg_match('/^5[1-5]/', $numero) => 'Mastercard',
            (bool) preg_match('/^3[47]/', $numero) => 'American Express',
            default => 'Tarjeta',
        };
    }
}
