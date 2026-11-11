<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Codigo promocional con el que se agrego un cupon sin gastar puntos
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reward_redemptions', function (Blueprint $table) {
            $table->string('promo_code', 30)->nullable();
            $table->unique(['user_id', 'promo_code']);
        });
    }

    public function down(): void
    {
        Schema::table('reward_redemptions', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'promo_code']);
            $table->dropColumn('promo_code');
        });
    }
};
