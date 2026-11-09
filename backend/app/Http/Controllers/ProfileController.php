<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

// Consulta y edicion del perfil del usuario autenticado
class ProfileController extends Controller
{
    // GET /api/profile
    public function show(Request $request)
    {
        return response()->json([
            'message' => 'Perfil consultado correctamente.',
            'user'    => $request->user(),
        ]);
    }

    // PUT /api/profile
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'faculty'     => 'sometimes|nullable|string|max:100',
            'career'      => 'sometimes|nullable|string|max:150',
            'interests'   => 'sometimes|nullable|array|max:20',
            'interests.*' => 'string|max:60',
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'user'    => $user->fresh(),
        ]);
    }
}
