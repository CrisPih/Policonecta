<?php

// Tabla de inscripciones a eventos -- Cristina Pihuave

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();

            // Si se elimina el evento tambien se eliminan sus inscripciones
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->string('email');

            $table->timestamps();

            // Un mismo correo no puede inscribirse dos veces al mismo evento
            $table->unique(['event_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
