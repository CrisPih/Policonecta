<?php

namespace App\Http\Controllers;

use App\Models\RewardRedemption;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Catalogo de recompensas y canje de puntos por cupones
class RewardController extends Controller
{
    // GET /api/rewards
    public function index(Request $request)
    {
        $user = $request->user();

        $catalogo = collect(RewardRedemption::RECOMPENSAS)
            ->map(fn ($r, $clave) => ['key' => $clave, 'name' => $r['name'], 'points' => $r['points']])
            ->values();

        $cupones = RewardRedemption::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'message' => 'Recompensas consultadas correctamente.',
            'points'  => $user->fresh()->points,
            'rewards' => $catalogo,
            'coupons' => $cupones,
        ]);
    }

    // POST /api/rewards/{reward}/redeem
    public function redeem(Request $request, string $reward)
    {
        $recompensa = RewardRedemption::RECOMPENSAS[$reward] ?? null;

        if (!$recompensa) {
            return response()->json(['message' => 'Recompensa no encontrada.'], 404);
        }

        $user = $request->user();

        $cupon = DB::transaction(function () use ($user, $reward, $recompensa) {
            // El descuento solo se aplica si alcanzan los puntos
            $descontado = User::where('id', $user->id)
                ->where('points', '>=', $recompensa['points'])
                ->decrement('points', $recompensa['points']);

            if (!$descontado) {
                return null;
            }

            return RewardRedemption::create([
                'user_id' => $user->id,
                'reward'  => $reward,
                'points'  => $recompensa['points'],
                'code'    => 'PC-' . $recompensa['prefix'] . '-' . Str::upper(Str::random(6)),
                'status'  => 'disponible',
            ]);
        });

        if (!$cupon) {
            return response()->json(['message' => 'No tiene puntos suficientes para esta recompensa.'], 422);
        }

        return response()->json([
            'message' => 'Canje realizado. Su cupón está disponible.',
            'coupon'  => $cupon,
            'points'  => $user->fresh()->points,
        ], 201);
    }
}
