<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizerStatsController;
use App\Http\Controllers\RewardController;

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
Route::get('/events/conflicts', [EventController::class, 'conflicts']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::get('/events/{event}/ratings', [RatingController::class, 'index']);

// Planes de publicacion destacada
Route::get('/featured-plans', [PaymentController::class, 'plans']);


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

    // Avisos dentro de la plataforma
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markAllRead']);

    // Pagos simulados: publicacion destacada e historial
    Route::post('/events/{event}/feature', [PaymentController::class, 'feature']);
    Route::get('/payments', [PaymentController::class, 'index']);

    // Asistencia por QR y valoracion de eventos
    Route::post('/events/{event}/attendance', [AttendanceController::class, 'store']);
    Route::post('/events/{event}/ratings', [RatingController::class, 'store']);

    // Recompensas: catalogo y canje de puntos
    Route::get('/rewards', [RewardController::class, 'index']);
    Route::post('/rewards/claim', [RewardController::class, 'claim']);
    Route::post('/rewards/{reward}/redeem', [RewardController::class, 'redeem']);

    // Tablero de metricas del organizador
    Route::get('/organizer/stats', [OrganizerStatsController::class, 'index']);

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