<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Clubes estudiantiles, organizadores externos y palabras clave de las publicaciones
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('acronym', 30)->nullable();
            $table->string('faculty', 100)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('club_id')->nullable()->constrained()->nullOnDelete();
            // Nombre de la organizacion ajena a la ESPOL que organiza el evento
            $table->string('external_organizer', 150)->nullable();
            // Palabras clave que se comparan con los intereses de los participantes
            $table->json('tags')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('club_id');
            $table->dropColumn(['external_organizer', 'tags']);
        });

        Schema::dropIfExists('clubs');
    }
};
