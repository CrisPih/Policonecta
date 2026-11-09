<?php

// Pruebas del registro y cancelacion de participacion -- Cristina Pihuave

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    // Las rutas de inscripciones requieren sesion iniciada
    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    // Crea un evento de prueba
    private function crearEvento($cupos = 2)
    {
        return Event::create([
            'title' => 'Charla de Innovacion',
            'description' => 'Charla abierta a la comunidad politecnica.',
            'category' => 'Academico',
            'modality' => 'Virtual',
            'faculty' => 'FIEC',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-01',
            'start_time' => '15:30',
            'location' => 'Zoom',
            'max_participants' => $cupos,
        ]);
    }

    public function test_registra_la_participacion_en_un_evento(): void
    {
        $event = $this->crearEvento();

        $response = $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Cristina Pihuave',
            'email' => 'cristina@espol.edu.ec',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('registration.name', 'Cristina Pihuave')
            ->assertJsonPath('available_spots', 1);

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'email' => 'cristina@espol.edu.ec',
        ]);
    }

    public function test_no_permite_inscribir_el_mismo_correo_dos_veces(): void
    {
        $event = $this->crearEvento();

        $datos = [
            'name' => 'Cristina Pihuave',
            'email' => 'cristina@espol.edu.ec',
        ];

        $this->postJson("/api/events/{$event->id}/registrations", $datos);
        $response = $this->postJson("/api/events/{$event->id}/registrations", $datos);

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Este correo ya se encuentra inscrito en el evento.');
    }

    public function test_no_permite_inscripciones_cuando_no_hay_cupos(): void
    {
        $event = $this->crearEvento(1);

        $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Cristina Pihuave',
            'email' => 'cristina@espol.edu.ec',
        ]);

        $response = $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Dhamar Patino',
            'email' => 'dhamar@espol.edu.ec',
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('available_spots', 0);
    }

    public function test_valida_los_datos_del_participante(): void
    {
        $event = $this->crearEvento();

        $response = $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => '',
            'email' => 'correo-invalido',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_cancela_la_participacion(): void
    {
        $event = $this->crearEvento();

        $registro = $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Cristina Pihuave',
            'email' => 'cristina@espol.edu.ec',
        ])->json('registration');

        $response = $this->deleteJson("/api/events/{$event->id}/registrations/{$registro['id']}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Participación cancelada correctamente.')
            ->assertJsonPath('available_spots', 2);

        $this->assertDatabaseMissing('registrations', ['id' => $registro['id']]);
    }

    public function test_consulta_los_participantes_de_un_evento(): void
    {
        $event = $this->crearEvento();

        $this->postJson("/api/events/{$event->id}/registrations", [
            'name' => 'Cristina Pihuave',
            'email' => 'cristina@espol.edu.ec',
        ]);

        $response = $this->getJson("/api/events/{$event->id}/registrations");

        $response->assertStatus(200)
            ->assertJsonPath('registered_participants', 1)
            ->assertJsonPath('available_spots', 1)
            ->assertJsonCount(1, 'registrations');
    }

    public function test_devuelve_404_al_cancelar_una_inscripcion_inexistente(): void
    {
        $event = $this->crearEvento();

        $response = $this->deleteJson("/api/events/{$event->id}/registrations/999");

        $response->assertStatus(404)
            ->assertJsonPath('message', 'Inscripción no encontrada.');
    }
}
