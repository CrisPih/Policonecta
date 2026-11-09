<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\ProfileController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas
|--------------------------------------------------------------------------
*/

// Login y Registro -- Cristina Pihuave
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Consulta de eventos pública -- Dhamar Patiño / Cristina Pihuave
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/featured', [EventController::class, 'featured']);
Route::get('/events/{event}', [EventController::class, 'show']);


/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren autenticación / Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Perfil y recomendaciones
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/recommendations', [RecommendationController::class, 'index']);

    // Creación de eventos -- Dhamar Patiño
    Route::post('/events', [EventController::class, 'store']);

    // Actualización y eliminación de eventos -- Cristina Pihuave
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::patch('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);

    // Inscripciones de un participante -- Cristina Pihuave
    Route::get('/registrations', [RegistrationController::class, 'byParticipant']);

    // Registro y cancelación de participación por evento -- Cristina Pihuave
    Route::get('/events/{event}/registrations', [RegistrationController::class, 'index']);
    Route::post('/events/{event}/registrations', [RegistrationController::class, 'store']);
    Route::delete('/events/{event}/registrations/{registration}', [RegistrationController::class, 'destroy']);

});