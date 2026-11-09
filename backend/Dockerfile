# Imagen para desplegar el backend de Laravel -- Cristina Pihuave
FROM php:8.2-cli

# Extensiones que necesita el proyecto: PostgreSQL, imagenes, zip e intl
RUN apt-get update && apt-get install -y \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libicu-dev \
        zip \
        unzip \
        git \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install pdo_pgsql pgsql zip gd intl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Se copian primero los archivos de dependencias para aprovechar la cache
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .

RUN composer dump-autoload --optimize \
    && php artisan storage:link || true

# Render entrega el puerto en la variable PORT
CMD php artisan serve --host 0.0.0.0 --port ${PORT:-8000}
