<?php

// Permite que el frontend desplegado consuma la API -- Cristina Pihuave
// Los dominios permitidos se definen en FRONTEND_URL, separados por comas

$origenes = array_filter(array_map('trim', explode(',', env('FRONTEND_URL', ''))));

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // En local se permite cualquier origen; en produccion solo los configurados
    'allowed_origins' => empty($origenes) ? ['*'] : $origenes,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
