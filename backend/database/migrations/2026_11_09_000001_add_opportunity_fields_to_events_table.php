<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Tipos de publicacion, fecha limite y publicaciones destacadas
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // evento, pasantia, beca, investigacion o convocatoria
            $table->string('type')->default('evento');

            // Fecha limite de inscripcion o postulacion
            $table->date('deadline')->nullable();

            // Enlace de postulacion o informacion adicional
            $table->string('external_link')->nullable();

            // Publicacion destacada en el carrusel del inicio
            $table->boolean('is_featured')->default(false);
            $table->date('featured_until')->nullable();
            $table->string('sponsor')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['type', 'deadline', 'external_link', 'is_featured', 'featured_until', 'sponsor']);
        });
    }
};
