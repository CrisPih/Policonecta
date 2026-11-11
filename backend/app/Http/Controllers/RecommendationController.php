<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use Carbon\Carbon;
use Illuminate\Http\Request;

// Motor de recomendaciones (DSS): ordena las publicaciones segun el perfil del usuario
class RecommendationController extends Controller
{
    // Pesos de cada criterio
    private const PESO_INTERES = 3;
    private const PESO_FACULTAD = 2;
    private const PESO_CARRERA = 2;
    private const PESO_HISTORIAL = 1;
    private const MAXIMO_HISTORIAL = 3;
    private const PESO_FECHA_LIMITE = 1;
    private const DIAS_FECHA_LIMITE = 7;

    // GET /api/recommendations?limit=6
    public function index(Request $request)
    {
        $request->validate(['limit' => 'nullable|integer|min:1|max:20']);

        $user = $request->user();
        $limit = (int) $request->input('limit', 6);
        $today = Carbon::today();

        $intereses = collect($user->interests ?? [])->map(fn ($i) => mb_strtolower($i));
        $palabrasCarrera = self::palabrasCarrera($user->career);

        // Historial: categorias y tipos de las publicaciones en las que se inscribio
        $historial = Registration::with('event')
            ->where('email', $user->email)
            ->get()
            ->pluck('event')
            ->filter();

        $inscritos = $historial->pluck('id')->all();
        $categoriasPrevias = $historial->pluck('category')->filter()->map(fn ($c) => mb_strtolower($c))->countBy();
        $tiposPrevios = $historial->pluck('type')->filter()->countBy();

        $candidatos = Event::query()
            ->where('status', 'published')
            ->whereNotIn('id', $inscritos)
            ->withCount('registrations')
            ->get()
            ->filter(fn ($e) => !$this->vencido($e, $today));

        Event::addSpots($candidatos);

        $recomendados = $candidatos
            ->filter(fn ($e) => $e->available_spots === null || $e->available_spots > 0)
            ->map(function ($event) use ($user, $intereses, $palabrasCarrera, $categoriasPrevias, $tiposPrevios, $today) {
                $puntaje = 0;
                $razones = [];

                $categoria = mb_strtolower($event->category ?? '');
                if ($categoria && $intereses->contains($categoria)) {
                    $puntaje += self::PESO_INTERES;
                    $razones[] = 'Coincide con su interés en ' . $event->category;
                }

                if ($event->type && $intereses->contains($event->type)) {
                    $puntaje += self::PESO_INTERES;
                    $razones[] = 'Coincide con su interés en ' . self::nombreTipo($event->type);
                }

                if ($user->faculty && $event->faculty === $user->faculty) {
                    $puntaje += self::PESO_FACULTAD;
                    $razones[] = 'Organizado por su facultad';
                }

                $texto = mb_strtolower($event->title . ' ' . $event->description);
                if ($palabrasCarrera->contains(fn ($p) => str_contains($texto, $p))) {
                    $puntaje += self::PESO_CARRERA;
                    $razones[] = 'Relacionado con su carrera';
                }

                $previas = min(
                    ($categoriasPrevias[$categoria] ?? 0) + ($tiposPrevios[$event->type] ?? 0),
                    self::MAXIMO_HISTORIAL
                );
                if ($previas > 0) {
                    $puntaje += $previas * self::PESO_HISTORIAL;
                    $razones[] = 'Similar a publicaciones a las que asistió';
                }

                $limite = $event->deadline ? Carbon::parse($event->deadline) : null;
                if ($limite && $limite->between($today, $today->copy()->addDays(self::DIAS_FECHA_LIMITE))) {
                    $puntaje += self::PESO_FECHA_LIMITE;
                    $razones[] = 'La fecha límite está próxima';
                }

                $event->score = $puntaje;
                $event->reasons = $razones;

                return $event;
            })
            ->filter(fn ($e) => $e->score > 0)
            ->sortBy([
                ['score', 'desc'],
                ['start_date', 'asc'],
            ])
            ->take($limit)
            ->values();

        return response()->json([
            'message' => 'Recomendaciones consultadas correctamente.',
            'events'  => $recomendados,
        ]);
    }

    // Una publicacion vence cuando paso su fecha limite o su fecha de fin
    private function vencido(Event $event, Carbon $today): bool
    {
        if ($event->deadline) {
            return Carbon::parse($event->deadline)->lt($today);
        }

        $fin = $event->end_date ?? $event->start_date;

        return $fin ? Carbon::parse($fin)->lt($today) : false;
    }

    // Palabras significativas de la carrera, sin los grados academicos
    private static function palabrasCarrera(?string $carrera)
    {
        $comunes = ['ingenieria', 'ingeniería', 'licenciatura', 'maestria', 'maestría', 'tecnologia', 'tecnología'];

        return collect(preg_split('/[\s,]+/u', mb_strtolower($carrera ?? '')))
            ->filter(fn ($p) => mb_strlen($p) >= 5 && !in_array($p, $comunes, true))
            ->map(fn ($p) => mb_substr($p, 0, 7))
            ->values();
    }

    private static function nombreTipo(string $tipo): string
    {
        return [
            'evento'        => 'eventos',
            'pasantia'      => 'pasantías',
            'beca'          => 'becas',
            'investigacion' => 'investigación',
            'convocatoria'  => 'convocatorias',
        ][$tipo] ?? $tipo;
    }
}
