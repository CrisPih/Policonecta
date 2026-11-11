<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// Pagos simulados, asistencia por QR, puntos, valoraciones, cruces, avisos y reportes
class ModulosPoliConectaTest extends TestCase
{
    use RefreshDatabase;

    private const TARJETA = [
        'card_name' => 'Cristina Pihuave',
        'card_number' => '4242 4242 4242 4242',
        'card_expiry' => '12/30',
        'card_cvv' => '123',
    ];

    private function organizador(): User
    {
        return User::factory()->create(['role' => 'organizer', 'faculty' => 'FIEC']);
    }

    private function evento(User $dueno, array $datos = []): Event
    {
        return Event::create($datos + [
            'user_id' => $dueno->id,
            'title' => 'Taller de prueba',
            'description' => 'Descripcion',
            'category' => 'Taller',
            'modality' => 'Presencial',
            'faculty' => 'FIEC',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'start_time' => '10:00',
            'end_time' => '12:00',
            'location' => 'Aula 1',
            'max_participants' => 10,
            'status' => 'published',
        ]);
    }

    public function test_destacar_cobra_el_plan_y_activa_el_carrusel(): void
    {
        $org = $this->organizador();
        $event = $this->evento($org);
        Sanctum::actingAs($org);

        $this->postJson("/api/events/{$event->id}/feature", ['plan_days' => 7, 'sponsor' => 'Aliado'] + self::TARJETA)
            ->assertCreated()
            ->assertJsonPath('payment.amount', 15)
            ->assertJsonPath('payment.card_last4', '4242')
            ->assertJsonPath('event.is_featured', true)
            ->assertJsonPath('event.sponsor', 'Aliado');

        $this->assertSame(now()->addDays(7)->toDateString(), substr($event->fresh()->featured_until, 0, 10));
        $this->getJson('/api/events/featured')->assertJsonCount(1, 'events');
    }

    public function test_destacar_rechaza_tarjeta_y_a_quien_no_es_dueno(): void
    {
        $org = $this->organizador();
        $event = $this->evento($org);

        Sanctum::actingAs($org);
        $this->postJson("/api/events/{$event->id}/feature", ['plan_days' => 7, 'card_number' => '4000 0000 0000 0002'] + self::TARJETA)
            ->assertStatus(422)
            ->assertJsonValidationErrors('card_number');

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/events/{$event->id}/feature", ['plan_days' => 7] + self::TARJETA)->assertForbidden();

        $this->assertFalse($event->fresh()->is_featured);
    }

    public function test_la_creacion_no_permite_destacar_sin_pagar(): void
    {
        Sanctum::actingAs($this->organizador());

        $this->postJson('/api/events', [
            'title' => 'Intento', 'description' => 'x', 'category' => 'Taller', 'modality' => 'Presencial',
            'faculty' => 'FIEC', 'start_date' => now()->addDay()->toDateString(), 'start_time' => '10:00',
            'location' => 'Aula', 'max_participants' => 5, 'is_featured' => true,
        ])->assertCreated()->assertJsonPath('event.is_featured', null);

        $this->assertFalse(Event::first()->fresh()->is_featured);
    }

    public function test_entrada_pagada_exige_tarjeta_y_se_reembolsa_al_cancelar(): void
    {
        $event = $this->evento($this->organizador(), ['price' => 10]);
        Sanctum::actingAs(User::factory()->create(['email' => 'ana@espol.edu.ec']));

        $participante = ['name' => 'Ana', 'email' => 'ana@espol.edu.ec'];

        $this->postJson("/api/events/{$event->id}/registrations", $participante)
            ->assertStatus(422)
            ->assertJsonValidationErrors('card_number');

        $respuesta = $this->postJson("/api/events/{$event->id}/registrations", $participante + self::TARJETA)
            ->assertCreated()
            ->assertJsonPath('payment.amount', 10)
            ->assertJsonPath('payment.concept', 'entrada');

        $this->assertStringStartsWith("POLICONECTA:{$event->id}:", $respuesta->json('registration.qr_content'));

        $id = $respuesta->json('registration.id');
        $this->deleteJson("/api/events/{$event->id}/registrations/{$id}")
            ->assertOk()
            ->assertJsonPath('message', 'Participación cancelada. El pago fue reembolsado.');

        $this->assertDatabaseHas('payments', ['concept' => 'entrada', 'status' => 'reembolsado']);
    }

    public function test_asistencia_por_qr_suma_puntos_una_sola_vez(): void
    {
        $org = $this->organizador();
        $event = $this->evento($org);
        $otro = $this->evento($org, ['title' => 'Otro']);
        $alumno = User::factory()->create(['email' => 'luis@espol.edu.ec']);
        $registro = Registration::create(['event_id' => $event->id, 'name' => 'Luis', 'email' => $alumno->email]);

        Sanctum::actingAs($org);

        $this->postJson("/api/events/{$otro->id}/attendance", ['code' => $registro->qrContent()])->assertStatus(422);

        $this->postJson("/api/events/{$event->id}/attendance", ['code' => $registro->qrContent()])
            ->assertOk()
            ->assertJsonPath('points_awarded', Registration::PUNTOS_ASISTENCIA);

        $this->postJson("/api/events/{$event->id}/attendance", ['code' => $registro->qrContent()])->assertStatus(409);

        $this->assertSame(Registration::PUNTOS_ASISTENCIA, $alumno->fresh()->points);

        Sanctum::actingAs($alumno);
        $this->postJson("/api/events/{$event->id}/attendance", ['code' => $registro->qrContent()])->assertForbidden();
    }

    public function test_solo_los_asistentes_valoran(): void
    {
        $event = $this->evento($this->organizador());
        $alumno = User::factory()->create();
        $registro = Registration::create(['event_id' => $event->id, 'name' => 'A', 'email' => $alumno->email]);

        Sanctum::actingAs($alumno);
        $this->postJson("/api/events/{$event->id}/ratings", ['rating' => 5])->assertForbidden();

        $registro->update(['attended_at' => now()]);
        $this->postJson("/api/events/{$event->id}/ratings", ['rating' => 4, 'comment' => 'Muy útil'])->assertCreated();

        $this->getJson("/api/events/{$event->id}/ratings")
            ->assertJsonPath('average', 4)
            ->assertJsonPath('count', 1);
    }

    public function test_detecta_cruces_de_horario_para_la_misma_facultad(): void
    {
        $org = $this->organizador();
        $event = $this->evento($org);
        $fecha = $event->start_date;

        $this->getJson("/api/events/conflicts?start_date={$fecha}&start_time=11:00&end_time=13:00&faculty=FIEC")
            ->assertJsonCount(1, 'conflicts');

        $this->getJson("/api/events/conflicts?start_date={$fecha}&start_time=14:00&end_time=15:00&faculty=FIEC")
            ->assertJsonCount(0, 'conflicts');

        $this->getJson("/api/events/conflicts?start_date={$fecha}&start_time=11:00&faculty=FCNM")
            ->assertJsonCount(0, 'conflicts');

        $this->getJson("/api/events/conflicts?start_date={$fecha}&start_time=11:00&faculty=FIEC&exclude_id={$event->id}")
            ->assertJsonCount(0, 'conflicts');
    }

    public function test_avisa_publicaciones_afines_y_recordatorios(): void
    {
        $alumno = User::factory()->create(['role' => 'user', 'faculty' => 'FIEC', 'interests' => ['beca']]);
        $ajeno = User::factory()->create(['role' => 'user', 'faculty' => 'FCNM', 'interests' => []]);
        $org = $this->organizador();

        Sanctum::actingAs($org);
        $this->postJson('/api/events', [
            'title' => 'Beca nueva', 'description' => 'x', 'type' => 'beca', 'category' => 'Académico',
            'faculty' => 'FIEC', 'start_date' => now()->addDays(20)->toDateString(),
            'deadline' => now()->addDays(2)->toDateString(),
        ])->assertCreated();

        $this->assertSame(1, UserNotification::where('user_id', $alumno->id)->where('kind', 'nueva')->count());
        $this->assertSame(0, UserNotification::where('user_id', $ajeno->id)->count());

        $manana = $this->evento($org, ['start_date' => now()->addDay()->toDateString(), 'end_date' => now()->addDay()->toDateString()]);
        Registration::create(['event_id' => $manana->id, 'name' => 'A', 'email' => $alumno->email]);

        Sanctum::actingAs($alumno);
        $respuesta = $this->getJson('/api/notifications')->assertOk();
        $tipos = collect($respuesta->json('notifications'))->pluck('kind');

        $this->assertTrue($tipos->contains('recordatorio'));
        $this->assertTrue($tipos->contains('cierre'));

        $this->postJson('/api/notifications/read')->assertJsonPath('unread', 0);
    }

    public function test_tablero_resume_inscripcion_asistencia_e_ingresos(): void
    {
        $org = $this->organizador();
        $event = $this->evento($org, ['price' => 5]);
        $alumno = User::factory()->create(['email' => 'eva@espol.edu.ec', 'faculty' => 'FIEC', 'career' => 'Computación']);

        Sanctum::actingAs($alumno);
        $id = $this->postJson("/api/events/{$event->id}/registrations", ['name' => 'Eva', 'email' => $alumno->email] + self::TARJETA)
            ->json('registration.id');
        Registration::find($id)->update(['attended_at' => now()]);

        Sanctum::actingAs($org);
        $this->getJson('/api/organizer/stats')
            ->assertOk()
            ->assertJsonPath('totals.registered', 1)
            ->assertJsonPath('totals.attended', 1)
            ->assertJsonPath('totals.attendance_rate', 100)
            ->assertJsonPath('totals.ticket_income', 5)
            ->assertJsonPath('by_faculty.0.name', 'FIEC')
            ->assertJsonPath('by_career.0.name', 'Computación');
    }

    public function test_canje_descuenta_puntos_y_exige_saldo(): void
    {
        $alumno = User::factory()->create();
        $alumno->forceFill(['points' => 40])->save();
        Sanctum::actingAs($alumno);

        $this->postJson('/api/rewards/shop/redeem')
            ->assertCreated()
            ->assertJsonPath('points', 10)
            ->assertJsonPath('coupon.status', 'disponible');

        $this->postJson('/api/rewards/bar/redeem')->assertStatus(422);
        $this->postJson('/api/rewards/inexistente/redeem')->assertNotFound();

        $this->getJson('/api/rewards')
            ->assertJsonPath('points', 10)
            ->assertJsonCount(3, 'rewards')
            ->assertJsonCount(1, 'coupons');
    }

    public function test_codigo_promocional_agrega_un_cupon_una_sola_vez(): void
    {
        $alumno = User::factory()->create();
        Sanctum::actingAs($alumno);

        $this->postJson('/api/rewards/claim', ['code' => ' bienvenida2026 '])
            ->assertCreated()
            ->assertJsonPath('coupon.reward', 'entrada')
            ->assertJsonPath('coupon.points', 0);

        $this->postJson('/api/rewards/claim', ['code' => 'BIENVENIDA2026'])->assertStatus(409);
        $this->postJson('/api/rewards/claim', ['code' => 'NOEXISTE'])->assertStatus(422);

        $this->assertSame(0, $alumno->fresh()->points);
    }

    public function test_cupon_de_entrada_gratis_se_usa_y_se_devuelve_al_cancelar(): void
    {
        $event = $this->evento($this->organizador(), ['price' => 10]);
        $alumno = User::factory()->create(['email' => 'rosa@espol.edu.ec']);
        $alumno->forceFill(['points' => 50])->save();
        Sanctum::actingAs($alumno);

        $codigo = $this->postJson('/api/rewards/entrada/redeem')->json('coupon.code');
        $participante = ['name' => 'Rosa', 'email' => $alumno->email];

        $id = $this->postJson("/api/events/{$event->id}/registrations", $participante + ['coupon_code' => $codigo])
            ->assertCreated()
            ->assertJsonPath('payment', null)
            ->assertJsonPath('coupon.status', 'usado')
            ->json('registration.id');

        $this->assertDatabaseCount('payments', 0);

        $this->deleteJson("/api/events/{$event->id}/registrations/{$id}")
            ->assertJsonPath('message', 'Participación cancelada. Su cupón vuelve a estar disponible.');

        $this->assertDatabaseHas('reward_redemptions', ['code' => $codigo, 'status' => 'disponible']);

        // Un cupon de otra persona no sirve
        Sanctum::actingAs(User::factory()->create(['email' => 'otro@espol.edu.ec']));
        $this->postJson("/api/events/{$event->id}/registrations", ['name' => 'Otro', 'email' => 'otro@espol.edu.ec', 'coupon_code' => $codigo])
            ->assertStatus(422);
    }
}
