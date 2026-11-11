<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use App\Services\Notificador;
use Illuminate\Http\Request;

// Avisos del usuario dentro de la plataforma
class NotificationController extends Controller
{
    // GET /api/notifications
    public function index(Request $request)
    {
        $user = $request->user();
        Notificador::generarPendientes($user);

        $avisos = UserNotification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        return response()->json([
            'message'       => 'Avisos consultados correctamente.',
            'unread'        => UserNotification::where('user_id', $user->id)->whereNull('read_at')->count(),
            'notifications' => $avisos,
        ]);
    }

    // POST /api/notifications/read
    public function markAllRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Avisos marcados como leídos.', 'unread' => 0]);
    }
}
