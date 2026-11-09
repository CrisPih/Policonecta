<?php

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
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            // Relación con la tabla users (Organizador)
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');

            $table->string('title');
            $table->text('description')->nullable();

            $table->string('category')->nullable();
            $table->string('modality')->nullable();
            $table->string('faculty')->nullable();

            // Fechas y horas (soporta eventos de un día o de varios)
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            $table->string('image')->nullable();
            $table->string('location')->nullable();

            $table->unsignedInteger('max_participants')->nullable();

            // Estado del evento: draft o published (por defecto publicado)
            $table->string('status')->default('published');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};