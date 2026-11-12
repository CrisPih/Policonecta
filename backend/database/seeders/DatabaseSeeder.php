<?php

namespace Database\Seeders;

use App\Models\Club;
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

        // Clubes estudiantiles
        $clubes = collect([
            ['FanPol', 'Club de Apreciación de la Cultura Asiática', 'FCSH', 'Difunde la cultura de Japón, Corea y China con ferias, talleres de idiomas y proyecciones.'],
            ['CIAP', 'Club de Ciencia de Datos e Inteligencia Artificial', 'FIEC', 'Talleres, competencias y proyectos de ciencia de datos, aprendizaje automático e inteligencia artificial.'],
            ['PhyCom', 'Club de Physical Computing', 'FIEC', 'Prototipos que unen programación y electrónica: sensores, microcontroladores y objetos interactivos.'],
            ['Robótica FIEC', 'Club de Robótica FIEC', 'FIEC', 'Diseño y construcción de robots para competencias nacionales e internacionales.'],
            ['Debate ESPOL', 'Club de Debate ESPOL', 'FCSH', 'Entrenamiento en oratoria y argumentación, y torneos de debate universitario.'],
            ['Foto ESPOL', 'Club de Fotografía ESPOL', 'FADCOM', 'Salidas fotográficas, talleres de edición y exposiciones en el campus.'],
        ])->mapWithKeys(fn ($c) => [$c[0] => Club::updateOrCreate(
            ['name' => $c[1]],
            ['acronym' => $c[0], 'faculty' => $c[2], 'description' => $c[3]]
        )]);

        $publicaciones = [
            [
                'title' => 'Feria de Pasantías 2026',
                'description' => 'Empresas aliadas presentan sus programas de pasantías para estudiantes de últimos semestres.',
                'type' => 'evento', 'category' => 'Feria', 'modality' => 'Presencial', 'faculty' => 'FIEC',
                'start_date' => $dia(6), 'end_date' => $dia(7), 'start_time' => '09:00', 'end_time' => '16:00',
                'location' => 'Coliseo ESPOL', 'max_participants' => 400,
                'is_featured' => true, 'sponsor' => 'Banco del Litoral',
                'tags' => ['pasantías', 'empleo', 'empresas'],
            ],
            [
                'title' => 'Congreso de Inteligencia Artificial Aplicada',
                'description' => 'Conferencias y talleres sobre aprendizaje automático en la industria ecuatoriana.',
                'type' => 'evento', 'category' => 'Congreso', 'modality' => 'Híbrido', 'faculty' => 'FIEC',
                'start_date' => $dia(15), 'end_date' => $dia(16), 'start_time' => '08:30', 'end_time' => '17:00',
                'location' => 'Auditorio FIEC', 'max_participants' => 250, 'price' => 10.00,
                'is_featured' => true, 'sponsor' => 'TechEcuador',
                'tags' => ['inteligencia artificial', 'machine learning', 'ciencia de datos'],
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
                'club_id' => $clubes['Robótica FIEC']->id,
                'tags' => ['arduino', 'electrónica', 'robótica'],
            ],
            [
                'title' => 'Feria FanPol 2026',
                'description' => 'Feria de cultura asiática con cosplay, k-pop, gastronomía, juegos de mesa y talleres de japonés y coreano.',
                'type' => 'evento', 'category' => 'Cultural', 'modality' => 'Presencial', 'faculty' => 'FCSH',
                'start_date' => $dia(9), 'end_date' => $dia(10), 'start_time' => '10:00', 'end_time' => '18:00',
                'location' => 'Plaza central ESPOL', 'max_participants' => 500,
                'club_id' => $clubes['FanPol']->id,
                'tags' => ['anime', 'k-pop', 'cosplay', 'cultura asiática', 'idiomas'],
            ],
            [
                'title' => 'Taller de machine learning con Python',
                'description' => 'Introducción práctica a modelos de clasificación y regresión con scikit-learn.',
                'type' => 'evento', 'category' => 'Taller', 'modality' => 'Presencial', 'faculty' => 'FIEC',
                'start_date' => $dia(5), 'start_time' => '14:00', 'end_time' => '17:00',
                'location' => 'Laboratorio de Computación 3', 'max_participants' => 35,
                'club_id' => $clubes['CIAP']->id,
                'tags' => ['python', 'machine learning', 'ciencia de datos', 'inteligencia artificial'],
            ],
            [
                'title' => 'Datatón CIAP: datos abiertos de Guayaquil',
                'description' => 'Competencia de 8 horas para analizar datos abiertos de movilidad y proponer soluciones.',
                'type' => 'evento', 'category' => 'Hackathon', 'modality' => 'Presencial', 'faculty' => 'FIEC',
                'start_date' => $dia(18), 'start_time' => '08:00', 'end_time' => '16:00',
                'location' => 'Edificio de la FIEC', 'max_participants' => 60,
                'club_id' => $clubes['CIAP']->id,
                'tags' => ['ciencia de datos', 'visualización', 'python', 'competencia'],
            ],
            [
                'title' => 'Noche de prototipos: wearables con microcontroladores',
                'description' => 'Construcción de prendas interactivas con sensores, LEDs y microcontroladores.',
                'type' => 'evento', 'category' => 'Taller', 'modality' => 'Presencial', 'faculty' => 'FIEC',
                'start_date' => $dia(7), 'start_time' => '17:00', 'end_time' => '21:00',
                'location' => 'Laboratorio de Prototipado', 'max_participants' => 25,
                'club_id' => $clubes['PhyCom']->id,
                'tags' => ['physical computing', 'arduino', 'electrónica', 'iot'],
            ],
            [
                'title' => 'Torneo de debate interfacultades',
                'description' => 'Equipos de tres integrantes debaten temas de actualidad en formato parlamentario.',
                'type' => 'evento', 'category' => 'Académico', 'modality' => 'Presencial', 'faculty' => 'FCSH',
                'start_date' => $dia(12), 'start_time' => '09:00', 'end_time' => '13:00',
                'location' => 'Auditorio FCSH', 'max_participants' => 48,
                'club_id' => $clubes['Debate ESPOL']->id,
                'tags' => ['debate', 'oratoria', 'liderazgo'],
            ],
            [
                'title' => 'Salida fotográfica al Bosque Protector Prosperina',
                'description' => 'Recorrido guiado para practicar fotografía de naturaleza dentro del campus.',
                'type' => 'evento', 'category' => 'Cultural', 'modality' => 'Presencial', 'faculty' => 'FADCOM',
                'start_date' => $dia(8), 'start_time' => '07:00', 'end_time' => '10:00',
                'location' => 'Bosque Protector Prosperina', 'max_participants' => 20,
                'club_id' => $clubes['Foto ESPOL']->id,
                'tags' => ['fotografía', 'naturaleza', 'arte'],
            ],
            [
                'title' => 'Fin de semana de emprendimiento Guayaquil',
                'description' => 'Evento de 54 horas para formar equipos y validar ideas de negocio con mentores.',
                'type' => 'evento', 'category' => 'Hackathon', 'modality' => 'Presencial', 'faculty' => 'ESPAE',
                'start_date' => $dia(20), 'end_date' => $dia(22), 'start_time' => '18:00', 'end_time' => '20:00',
                'location' => 'Centro de Emprendimiento ESPOL', 'max_participants' => 120, 'price' => 15.00,
                'external_organizer' => 'Comunidad Emprende Litoral',
                'tags' => ['emprendimiento', 'innovación', 'negocios'],
            ],
            [
                'title' => 'Conferencia de ciberseguridad para el sector financiero',
                'description' => 'Especialistas de la industria presentan casos reales de ataques y defensas.',
                'type' => 'evento', 'category' => 'Conferencia', 'modality' => 'Virtual', 'faculty' => 'FIEC',
                'start_date' => $dia(14), 'start_time' => '18:30', 'end_time' => '20:30',
                'location' => 'Transmisión en línea', 'max_participants' => 300,
                'external_organizer' => 'Red de Seguridad Digital del Ecuador',
                'tags' => ['ciberseguridad', 'redes', 'finanzas'],
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
