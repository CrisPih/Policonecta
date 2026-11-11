<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Cupones obtenidos al canjear puntos por recompensas
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // shop, bar o entrada
            $table->string('reward', 20);
            $table->unsignedInteger('points');
            $table->string('code', 30)->unique();
            // disponible o usado
            $table->string('status', 20)->default('disponible');
            $table->foreignId('registration_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_redemptions');
    }
};
