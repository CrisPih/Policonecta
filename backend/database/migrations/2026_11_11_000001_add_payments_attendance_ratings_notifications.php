<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

// Pagos simulados, asistencia por QR, puntos, valoraciones y notificaciones
return new class extends Migration
{
    public function up(): void
    {
        // Precio de la entrada; null o 0 significa evento gratuito
        Schema::table('events', function (Blueprint $table) {
            $table->decimal('price', 8, 2)->nullable();
        });

        // Puntos acumulados por asistencia verificada
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('points')->default(0);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            // destacado o entrada
            $table->string('concept', 20);
            $table->unsignedSmallInteger('plan_days')->nullable();
            $table->decimal('amount', 8, 2);
            $table->string('currency', 3)->default('USD');
            // aprobado o reembolsado
            $table->string('status', 20)->default('aprobado');
            $table->string('reference', 40)->unique();
            $table->string('payer_name')->nullable();
            $table->string('card_brand', 20)->nullable();
            $table->string('card_last4', 4)->nullable();
            $table->timestamps();
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('qr_token', 40)->nullable()->unique();
            $table->timestamp('attended_at')->nullable();
        });

        // Las inscripciones existentes reciben su codigo QR
        DB::table('registrations')->whereNull('qr_token')->orderBy('id')->each(function ($fila) {
            DB::table('registrations')->where('id', $fila->id)->update(['qr_token' => Str::random(32)]);
        });

        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['event_id', 'user_id']);
        });

        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained()->cascadeOnDelete();
            // nueva, recordatorio, cierre o valorar
            $table->string('kind', 20);
            $table->string('title');
            $table->string('body', 500)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'event_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('ratings');

        Schema::table('registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payment_id');
            $table->dropUnique(['qr_token']);
            $table->dropColumn(['qr_token', 'attended_at']);
        });

        Schema::dropIfExists('payments');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('points');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('price');
        });
    }
};
