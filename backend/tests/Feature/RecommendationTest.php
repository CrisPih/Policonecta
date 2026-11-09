<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// Pruebas de publicaciones destacadas, oportunidades y recomendaciones
class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    private function crear(array $datos = [])
    {
        return Event::create(array_merge([
            'title' => 'Publicacion de prueba',
            'description' => 'Descripcion',
            'category' => 'Taller',
            'type' => 'evento',
            'faculty' => 'FIEC',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
            'start_time' => '10:00',
            'location' => 'Auditorio',
            'max_participants' => 20,
        ], $datos));
    }

    public function test_featured_solo_devuelve_destacados_vigentes()
    {
        $this->crear(['title' => 'Destacado', 'is_featured' => true]);
        $this->crear(['title' => 'Normal']);
        $this->crear(['title' => 'Vencido', 'is_featured' => true, 'featured_until' => now()->subDay()->toDateString()]);

        $this->getJson('/api/events/featured')
            ->assertOk()
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.title', 'Destacado');
    }

    public function test_filtra_oportunidades()
    {
        $this->crear(['title' => 'Charla']);
        $this->crear(['title' => 'Pasantia', 'type' => 'pasantia', 'deadline' => now()->addDays(5)->toDateString()]);

        $this->getJson('/api/events?kind=oportunidades')
            ->assertOk()
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.title', 'Pasantia');
    }

    public function test_crear_pasantia_exige_fecha_limite_y_no_cupos()
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'organizer']));

        $this->postJson('/api/events', [
            'title' => 'Pasantia en empresa',
            'description' => 'Pasantia de seis meses',
            'category' => 'Laboral',
            'faculty' => 'FIEC',
            'type' => 'pasantia',
            'start_date' => now()->addDays(3)->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors('deadline');

        $this->postJson('/api/events', [
            'title' => 'Pasantia en empresa',
            'description' => 'Pasantia de seis meses',
            'category' => 'Laboral',
            'faculty' => 'FIEC',
            'type' => 'pasantia',
            'start_date' => now()->addDays(3)->toDateString(),
            'deadline' => now()->addDays(2)->toDateString(),
        ])->assertCreated();
    }

    public function test_recomienda_segun_intereses_y_facultad()
    {
        Sanctum::actingAs(User::factory()->create([
            'faculty' => 'FIEC',
            'interests' => ['beca'],
        ]));

        $this->crear(['title' => 'Beca FIEC', 'type' => 'beca', 'deadline' => now()->addDays(3)->toDateString()]);
        $this->crear(['title' => 'Taller FIEC']);
        $this->crear(['title' => 'Taller FIMCP', 'faculty' => 'FIMCP']);

        $respuesta = $this->getJson('/api/recommendations')->assertOk();

        $titulos = collect($respuesta->json('events'))->pluck('title')->all();
        $this->assertSame(['Beca FIEC', 'Taller FIEC'], $titulos);
    }

    public function test_actualiza_perfil()
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/profile', [
            'faculty' => 'FCNM',
            'career' => 'Matematica',
            'interests' => ['Taller', 'investigacion'],
        ])->assertOk()->assertJsonPath('user.interests', ['Taller', 'investigacion']);
    }
}
