<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Event;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// Clubes, organizadores externos y palabras clave
class ClubesYPalabrasClaveTest extends TestCase
{
    use RefreshDatabase;

    private function evento(array $datos = []): Event
    {
        return Event::create($datos + [
            'user_id' => User::factory()->create(['role' => 'organizer'])->id,
            'title' => 'Publicacion',
            'description' => 'Descripcion',
            'category' => 'Taller',
            'modality' => 'Presencial',
            'faculty' => 'FIEC',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'start_time' => '10:00',
            'location' => 'Aula',
            'max_participants' => 20,
            'status' => 'published',
        ]);
    }

    public function test_lista_clubes_y_sus_eventos(): void
    {
        $club = Club::create(['name' => 'Club de Physical Computing', 'acronym' => 'PhyCom', 'faculty' => 'FIEC']);
        $this->evento(['title' => 'Noche de prototipos', 'club_id' => $club->id]);
        $this->evento(['title' => 'Otro evento']);

        $this->getJson('/api/clubs')
            ->assertOk()
            ->assertJsonPath('clubs.0.acronym', 'PhyCom')
            ->assertJsonPath('clubs.0.upcoming_events_count', 1);

        $this->getJson("/api/clubs/{$club->id}")
            ->assertOk()
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.club.acronym', 'PhyCom');
    }

    public function test_filtra_por_quien_organiza(): void
    {
        $club = Club::create(['name' => 'Club de Debate', 'acronym' => 'Debate']);
        $this->evento(['title' => 'De facultad']);
        $this->evento(['title' => 'De club', 'club_id' => $club->id]);
        $this->evento(['title' => 'Externo', 'external_organizer' => 'Comunidad Emprende Litoral']);

        $this->getJson('/api/events?origin=club')->assertJsonCount(1, 'events')->assertJsonPath('events.0.title', 'De club');
        $this->getJson('/api/events?origin=externo')->assertJsonCount(1, 'events')->assertJsonPath('events.0.title', 'Externo');
        $this->getJson('/api/events?origin=facultad')->assertJsonCount(1, 'events')->assertJsonPath('events.0.title', 'De facultad');
    }

    public function test_busca_por_palabra_clave_y_club(): void
    {
        $club = Club::create(['name' => 'Club de Apreciación de la Cultura Asiática', 'acronym' => 'FanPol']);
        $this->evento(['title' => 'Feria', 'club_id' => $club->id, 'tags' => ['cosplay', 'cultura asiática']]);
        $this->evento(['title' => 'Charla']);

        $this->getJson('/api/events?search=' . urlencode('Asiática'))->assertJsonCount(1, 'events');
        $this->getJson('/api/events?search=fanpol')->assertJsonCount(1, 'events');
    }

    public function test_crea_publicacion_con_palabras_clave_limpias(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'organizer']));

        $this->postJson('/api/events', [
            'title' => 'Taller de Python', 'description' => 'x', 'category' => 'Taller', 'modality' => 'Presencial',
            'faculty' => 'FIEC', 'start_date' => now()->addDay()->toDateString(), 'start_time' => '10:00',
            'location' => 'Aula', 'max_participants' => 10,
            'tags' => [' python ', 'Python', 'datos', ''],
            'external_organizer' => 'Comunidad Python Ecuador',
        ])->assertCreated()
            ->assertJsonPath('event.tags', ['python', 'datos'])
            ->assertJsonPath('event.external_organizer', 'Comunidad Python Ecuador');
    }

    public function test_recomienda_y_avisa_por_palabras_clave(): void
    {
        $alumno = User::factory()->create(['role' => 'user', 'faculty' => 'FCNM', 'interests' => ['cosplay']]);
        Sanctum::actingAs($alumno);

        $this->evento(['title' => 'Feria FanPol', 'faculty' => 'FCSH', 'category' => 'Cultural', 'tags' => ['Cosplay', 'anime']]);
        $this->evento(['title' => 'Sin relacion', 'faculty' => 'FICT', 'category' => 'Deportivo']);

        $this->getJson('/api/recommendations')
            ->assertJsonCount(1, 'events')
            ->assertJsonPath('events.0.title', 'Feria FanPol')
            ->assertJsonPath('events.0.reasons.0', 'Coincide con su interés en Cosplay');

        Sanctum::actingAs(User::factory()->create(['role' => 'organizer']));
        $this->postJson('/api/events', [
            'title' => 'Concurso de cosplay', 'description' => 'x', 'category' => 'Cultural', 'modality' => 'Presencial',
            'faculty' => 'FCSH', 'start_date' => now()->addDay()->toDateString(), 'start_time' => '10:00',
            'location' => 'Plaza', 'max_participants' => 50, 'tags' => ['cosplay'],
        ])->assertCreated();

        $this->assertSame(1, UserNotification::where('user_id', $alumno->id)->where('kind', 'nueva')->count());
    }
}
