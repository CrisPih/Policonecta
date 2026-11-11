<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Cupon obtenido al canjear puntos por una recompensa
class RewardRedemption extends Model
{
    // Catalogo de recompensas: clave => nombre, puntos y prefijo del codigo
    public const RECOMPENSAS = [
        'shop' => ['name' => '10 % de descuento en ESPOL Shop', 'points' => 30, 'prefix' => 'SHOP'],
        'bar' => ['name' => 'Comida gratis en un bar del campus', 'points' => 20, 'prefix' => 'BAR'],
        'entrada' => ['name' => 'Entrada gratis a un evento pagado', 'points' => 50, 'prefix' => 'ENT'],
    ];

    // Codigos promocionales que agregan un cupon sin gastar puntos
    public const PROMOCIONES = [
        'BIENVENIDA2026' => 'entrada',
        'ESPOLSHOP10' => 'shop',
        'BARPOLI' => 'bar',
    ];

    protected $fillable = [
        'user_id',
        'promo_code',
        'reward',
        'points',
        'code',
        'status',
        'registration_id',
        'used_at',
    ];

    protected $casts = [
        'points' => 'integer',
        'used_at' => 'datetime',
    ];

    protected $appends = ['name'];

    public function getNameAttribute(): string
    {
        return self::RECOMPENSAS[$this->reward]['name'] ?? $this->reward;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function registration()
    {
        return $this->belongsTo(Registration::class);
    }
}
