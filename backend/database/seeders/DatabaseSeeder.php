<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Seeder;

// Datos de demostracion: cuentas de prueba, eventos, oportunidades y destacados
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $organizador = User::updateOrCreate(
            ['email' => 'organizador@policonecta.test'],
            [
                'name' => 'Club de Robótica FIEC',
                'password' => 'policonecta123',
                'role' => 'organizer',
                'faculty' => 'FIEC',
            ]
        );

        $estudiante = User::updateOrCreate(
            ['email' => 'estudiante@policonecta.test'],
            [
                'name' => 'Julio Cevallos',
                'password' => 'policonecta123',
                'role' => 'user',
                'faculty' => 'FIEC',
                'career' => 'Ingeniería en Computación',
                'interests' => ['pasantia', 'beca', 'Taller'],
            ]
        );

        $dia = fn (int $n) => now()->addDays($n)->toDateString();

        $publicaciones = [
            [
                'title' => 'Feria de Pasantías 2026',
                'description' => 'Empresas aliadas presentan sus programas de pasantías para estudiantes de últimos semestres.',
                'type' => 'evento', 'category' => 'Feria', 'modality' => 'Presencial', 'faculty' => 'FIEC',
                'start_date' => $dia(6), 'end_date' => $dia(7), 'start_time' => '09:00', 'end_time' => '16:00',
                'location' => 'Coliseo ESPOL', 'max_participants' => 400,
                'is_featured' => true, 'sponsor' => 'Banco del Litoral',
            ],
            [
                'title' => 'Congreso de Inteligencia Artificial Aplicada',
                'description' => 'Conferencias y talleres sobre aprendizaje automático en la industria ecuatoriana.',
                'type' => 'evento', 'category' => 'Congreso', 'modality' => 'Híbrido', 'faculty' => 'FIEC',
                'start_date' => $dia(15), 'end_date' => $dia(16), 'start_time' => '08:30', 'end_time' => '17:00',
                'location' => 'Auditorio FIEC', 'max_participants' => 250, 'price' => 10.00,
                'is_featured' => true, 'sponsor' => 'TechEcuador',
            ],
            [
                'title' => 'Charla de bienvenida a la comunidad FIEC',
                'description' => 'Presentación de clubes, laboratorios y servicios de la facultad.',
                'type' => 'evento', 'category' => 'Conferencia', 'modality' => 'Presencial', 'faculty' => 'FIEC',
                'start_date' => $dia(-3), 'start_time' => '10:00', 'end_time' => '12:00',
                'location' => 'Auditorio FIEC', 'max_participants' => 120,
            ],
            [
                'title' => 'Taller de Arduino para principiantes',
                'description' => 'Taller práctico de electrónica y programación de microcontroladores.',
                'type' => 'evento', 'category' => 'Taller', 'modality' => 'Presencial', 'faculty' => 'FIEC',
                'start_date' => $dia(4), 'start_time' => '15:00', 'end_time' => '18:00',
                'location' => 'Laboratorio de Robótica', 'max_participants' => 30,
            ],
            [
                'title' => 'Torneo interfacultades de fútbol',
                'description' => 'Inscripción de equipos para el torneo del segundo término.',
                'type' => 'evento', 'category' => 'Deportivo', 'modality' => 'Presencial', 'faculty' => 'FCSH',
                'start_date' => $dia(10), 'start_time' => '10:00',
                'location' => 'Canchas ESPOL', 'max_participants' => 160,
            ],
            [
                'title' => 'Pasantía en desarrollo de software',
                'description' => 'Pasantía de seis meses en el área de desarrollo web para estudiantes de Computación.',
                'type' => 'pasantia', 'category' => 'Laboral', 'faculty' => 'FIEC',
                'start_date' => $dia(30), 'deadline' => $dia(5),
                'external_link' => 'https://www.espol.edu.ec',
                'is_featured' => true, 'sponsor' => 'Soluciones Andinas S.A.',
            ],
            [
                'title' => 'Beca de movilidad académica',
                'description' => 'Beca para cursar un semestre en una universidad aliada del extranjero.',
                'type' => 'beca', 'category' => 'Académico', 'faculty' => 'FCNM',
                'start_date' => $dia(60), 'deadline' => $dia(12),
                'external_link' => 'https://www.espol.edu.ec',
            ],
            [
                'title' => 'Asistente de investigación en energías renovables',
                'description' => 'El centro de investigación busca estudiantes para un proyecto de paneles solares.',
                'type' => 'investigacion', 'category' => 'Académico', 'faculty' => 'FIMCP',
                'start_date' => $dia(20), 'deadline' => $dia(9),
            ],
            [
                'title' => 'Convocatoria a ayudantías académicas',
                'description' => 'Postulación a ayudantías de cátedra para el próximo término.',
                'type' => 'convocatoria', 'category' => 'Académico', 'faculty' => 'FIEC',
                'start_date' => $dia(25), 'deadline' => $dia(3),
            ],
        ];

        foreach ($publicaciones as $datos) {
            Event::updateOrCreate(
                ['title' => $datos['title']],
                $datos + [
                    'user_id' => $organizador->id,
                    'status' => 'published',
                    'end_date' => $datos['end_date'] ?? $datos['start_date'],
                ]
            );
        }

        // El estudiante de prueba asistio a la charla de bienvenida y puede valorarla
        $charla = Event::where('title', 'Charla de bienvenida a la comunidad FIEC')->first();
        $registro = Registration::firstOrCreate(
            ['event_id' => $charla->id, 'email' => $estudiante->email],
            ['name' => $estudiante->name]
        );

        if (!$registro->attended_at) {
            $registro->update(['attended_at' => now()->subDays(3)]);
            $estudiante->increment('points', Registration::PUNTOS_ASISTENCIA);
        }

        // Saldo inicial para demostrar el canje de recompensas
        if ($estudiante->fresh()->points < 60) {
            $estudiante->forceFill(['points' => 60])->save();
        }
    }
}
