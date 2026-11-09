# Conexion del backend con Supabase

Supabase es un servicio que ofrece una base de datos PostgreSQL administrada. El backend de
PoliConecta se conecta a ella igual que a cualquier otra base de datos relacional, usando el
driver `pgsql` de Laravel. No se necesitan librerias adicionales.

## 1. Crear el proyecto en Supabase

1. Entrar a https://supabase.com y crear una cuenta.
2. Crear un nuevo proyecto (`New project`).
3. Elegir un nombre (por ejemplo `policonecta`), definir una contrasena para la base de datos
   y seleccionar la region mas cercana.
4. Guardar la contrasena, se necesita en el paso siguiente y no se vuelve a mostrar.

## 2. Obtener la cadena de conexion

En el panel del proyecto: **Connect** (o `Project Settings > Database`) y seleccionar
**Session pooler**. Se obtiene algo asi:

```text
postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

De ahi salen los valores:

| Dato | Valor |
|---|---|
| `DB_HOST` | `aws-1-us-east-1.pooler.supabase.com` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `postgres` |
| `DB_USERNAME` | `postgres.abcdefghijklmnop` |
| `DB_PASSWORD` | la contrasena definida al crear el proyecto |

> Se usa el **Session pooler** (puerto 5432) y no la conexion directa porque la conexion directa
> solo responde por IPv6. Tampoco se usa el *Transaction pooler* (puerto 6543) porque no admite
> sentencias preparadas y las migraciones de Laravel fallan.

## 3. Habilitar la extension de PostgreSQL en PHP

Laravel necesita `pdo_pgsql`. Para verificar:

```bash
php -m
```

Si `pdo_pgsql` no aparece, abrir el archivo `php.ini` y quitar el `;` de estas dos lineas:

```ini
extension=pdo_pgsql
extension=pgsql
```

Luego reiniciar la terminal (y Apache si se usa XAMPP).

## 4. Configurar el archivo .env

Desde la carpeta `backend/`:

```bash
cp .env.example .env
```

Completar los valores de Supabase en `.env` y generar la clave de la aplicacion:

```bash
php artisan key:generate
```

El archivo `.env` no se sube al repositorio porque contiene la contrasena. Solo se versiona
`.env.example`.

## 5. Crear las tablas

```bash
php artisan migrate
```

Esto crea en Supabase las tablas `events`, `registrations`, `users`, `cache` y `jobs`. Se pueden
revisar desde el panel de Supabase en la seccion **Table Editor**.

Para cargar los datos de demostracion (cuentas de prueba, eventos, oportunidades y destacados):

```bash
php artisan db:seed
```

Para verificar la conexion sin ejecutar migraciones:

```bash
php artisan db:show
```

## 6. Levantar el servidor

```bash
php artisan serve
```

La API queda disponible en `http://localhost:8000/api`.

## 7. Almacenamiento de imagenes (Supabase Storage)

Las imagenes de los eventos se guardan en Supabase Storage, de modo que sean visibles desde
cualquier equipo y no dependan de la carpeta local de quien las subio.

### Crear el bucket

1. En el panel de Supabase, entrar a **Storage** en el menu lateral.
2. Pulsar **New bucket**, nombrarlo `events` y marcarlo como **Public bucket**.
3. Guardar.

El bucket debe ser publico para que las imagenes puedan mostrarse en el frontend sin credenciales.

### Obtener las claves

En **Project Settings > API** se encuentran:

| Dato | Donde esta |
|---|---|
| `SUPABASE_URL` | Campo *Project URL*, por ejemplo `https://abcdefghijklmnop.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Clave `service_role` (hay que pulsar *Reveal*) |

### Configurar el .env

```ini
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SUPABASE_BUCKET=events
```

Al crear o editar un evento con imagen, el backend la sube al bucket y guarda en la base de datos
la URL publica, con esta forma:

```text
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/events/<archivo>
```

> La clave `service_role` da acceso completo al proyecto, saltandose las reglas de seguridad. Solo
> debe usarse desde el backend y nunca colocarse en el codigo del frontend ni subirse al
> repositorio. Vive unicamente en el archivo `.env`, que esta excluido por `.gitignore`.

Si estas variables se dejan vacias, el sistema sigue funcionando y guarda las imagenes en la
carpeta local `storage/app/public/events/`, como antes. Tambien se recurre a la carpeta local si
la subida a la nube falla, para no perder la imagen.

### Compresion de imagenes

El plan gratuito de Supabase incluye 1 GB de almacenamiento, por lo que las imagenes se comprimen
antes de subirse, en `app/Services/ImageStorage.php`:

- Se reducen a un ancho maximo de 1280 pixeles (nunca se agrandan).
- Se convierten a formato WebP con calidad 78.
- Si el resultado pesa mas que el archivo original, se conserva el original.

En pruebas, una fotografia de 210 KB y 1920 px quedo en 40 KB, un 81% menos. Con ese peso
promedio, el limite de 1 GB permite alrededor de 25 000 imagenes.

La compresion usa la libreria `intervention/image`, que requiere la extension **GD** de PHP. Para
verificar que este activa:

```bash
php -m
```

Si `gd` no aparece, quitar el `;` de la linea `extension=gd` en el archivo `php.ini` y reiniciar
la terminal.

## Notas

- Las busquedas de eventos usan el operador `ilike` cuando el motor es PostgreSQL, para que no
  distinga mayusculas de minusculas.
- Las pruebas automaticas (`php artisan test`) no usan Supabase: corren sobre una base SQLite en
  memoria configurada en `phpunit.xml`, para no modificar los datos reales.
- Si aparece el error `SSL connection has been closed unexpectedly`, verificar que
  `DB_SSLMODE=require` este presente en el `.env`.
