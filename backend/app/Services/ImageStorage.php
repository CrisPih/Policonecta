<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

// Compresion y almacenamiento de imagenes de eventos -- Cristina Pihuave
class ImageStorage
{
    // Ancho maximo y calidad de las imagenes guardadas
    private const ANCHO_MAXIMO = 1280;
    private const CALIDAD = 78;

    /**
     * Comprime la imagen y devuelve su URL publica.
     */
    public static function store(UploadedFile $file, string $folder = 'events'): string
    {
        [$contenido, $extension, $mime] = self::comprimir($file);
        $nombre = $folder . '/' . Str::uuid() . '.' . $extension;

        if (self::supabaseConfigurado()) {
            $url = self::subirASupabase($contenido, $nombre, $mime);

            if ($url) {
                return $url;
            }
        }

        return self::guardarEnLocal($contenido, $nombre);
    }

    /**
     * Reduce el tamano de la imagen y la convierte a WebP.
     * Devuelve el contenido, la extension y el tipo de archivo resultante.
     */
    private static function comprimir(UploadedFile $file): array
    {
        $original = file_get_contents($file->getRealPath());
        $sinCambios = [
            $original,
            strtolower($file->getClientOriginalExtension() ?: 'jpg'),
            $file->getMimeType() ?: 'application/octet-stream',
        ];

        try {
            $manager = new ImageManager(new Driver());
            $imagen = $manager->read($file->getRealPath());

            // Solo se reduce si es mas ancha que el limite; nunca se agranda
            $imagen->scaleDown(width: self::ANCHO_MAXIMO);
            $comprimida = (string) $imagen->toWebp(quality: self::CALIDAD);

            // Si comprimir no reduce el peso, se conserva el archivo original
            if (strlen($comprimida) >= strlen($original)) {
                return $sinCambios;
            }

            return [$comprimida, 'webp', 'image/webp'];
        } catch (\Throwable $e) {
            return $sinCambios;
        }
    }

    private static function supabaseConfigurado(): bool
    {
        return !empty(config('services.supabase.url'))
            && !empty(config('services.supabase.key'));
    }

    /**
     * Sube el archivo al bucket. Devuelve la URL publica o null si falla.
     */
    private static function subirASupabase(string $contenido, string $nombre, string $mime): ?string
    {
        $url = rtrim(config('services.supabase.url'), '/');
        $key = config('services.supabase.key');
        $bucket = config('services.supabase.bucket');

        $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $key,
                'apikey' => $key,
                'x-upsert' => 'true',
            ])
            ->withBody($contenido, $mime)
            ->post("{$url}/storage/v1/object/{$bucket}/{$nombre}");

        if ($response->failed()) {
            return null;
        }

        return "{$url}/storage/v1/object/public/{$bucket}/{$nombre}";
    }

    private static function guardarEnLocal(string $contenido, string $nombre): string
    {
        Storage::disk('public')->put($nombre, $contenido);

        return asset('storage/' . $nombre);
    }
}
