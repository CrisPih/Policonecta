<?php

// Pruebas del detalle, actualizacion y eliminacion de eventos -- Cristina Pihuave

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventDetailTest extends TestCase
{
    use RefreshDatabase;

    // Las rutas de escritura requieren sesion iniciada
    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    // Crea un evento de prueba
    private function crearEvento($cupos = 50)
    {
        return Event::create([
            'title' => 'Feria de Ciencias ESPOL',
            'description' => 'Exposicion de proyectos estudiantiles.',
            'category' => 'Academico',
            'modality' => 'Presencial',
            'faculty' => 'FIEC',
            'start_date' => '2026-09-15',
            'end_date' => '2026-09-15',
            'start_time' => '10:00',
            'location' => 'Auditorio FIEC',
            'max_participants' => $cupos,
        ]);
    }

    public function test_consulta_el_detalle_de_un_evento(): void
    {
        $event = $this->crearEvento();

        $response = $this->getJson("/api/events/{$event->id}");

        $response->assertStatus(200)
            ->assertJsonPath('event.title', 'Feria de Ciencias ESPOL')
            ->assertJsonPath('registered_participants', 0)
            ->assertJsonPath('available_spots', 50);
    }

    public function test_devuelve_404_si_el_evento_no_existe(): void
    {
        $response = $this->getJson('/api/events/999');

        $response->assertStatus(404)
            ->assertJsonPath('message', 'Evento no encontrado.');
    }

    public function test_actualiza_un_evento(): void
    {
        $event = $this->crearEvento();

        $response = $this->putJson("/api/events/{$event->id}", [
            'title' => 'Feria de Ciencias ESPOL 2026',
            'location' => 'Coliseo ESPOL',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('event.title', 'Feria de Ciencias ESPOL 2026')
            ->assertJsonPath('event.location', 'Coliseo ESPOL');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Feria de Ciencias ESPOL 2026',
        ]);
    }

    public function test_rechaza_una_actualizacion_invalida(): void
    {
        $event = $this->crearEvento();

        $response = $this->putJson("/api/events/{$event->id}", [
            'max_participants' => 0,
        ]);

        $response->assertStatus(422);
    }

    public function test_no_permite_reducir_los_cupos_por_debajo_de_los_inscritos(): void
    {
        $event = $this->crearEvento(3);

        $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Cristina Pihuave',
            'email' => 'cristina@espol.edu.ec',
        ]);

        $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Dhamar Patino',
            'email' => 'dhamar@espol.edu.ec',
        ]);

        $response = $this->putJson("/api/events/{$event->id}", [
            'max_participants' => 1,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('registered_participants', 2);
    }

    public function test_elimina_un_evento(): void
    {
        $event = $this->crearEvento();

        $response = $this->deleteJson("/api/events/{$event->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Evento eliminado correctamente.');

        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }

    public function test_al_eliminar_el_evento_se_eliminan_sus_inscripciones(): void
    {
        $event = $this->crearEvento();

        $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Cristina Pihuave',
            'email' => 'cristina@espol.edu.ec',
        ]);

        $this->deleteJson("/api/events/{$event->id}");

        $this->assertDatabaseMissing('registrations', ['event_id' => $event->id]);
    }
}
