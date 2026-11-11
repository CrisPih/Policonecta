# Despliegue de PoliConecta

La aplicacion se despliega en tres servicios:

| Componente | Servicio | Para que sirve |
|---|---|---|
| Base de datos e imagenes | Supabase | Guarda los datos y las imagenes |
| Backend (Laravel) | Render | Ejecuta la API |
| Frontend (React) | Vercel | Sirve la interfaz |

El orden importa: **primero el backend**, porque el frontend necesita su direccion.

---

## 0. Base de datos en Supabase

1. Crear un proyecto nuevo en Supabase y el bucket publico `events` siguiendo [SUPABASE.md](SUPABASE.md).
2. Colocar los datos de conexion en `backend/.env` y crear las tablas desde el equipo local:

```bash
php artisan migrate --seed
```

El `--seed` carga las cuentas y publicaciones de demostracion. Se omite si no se quieren datos de ejemplo.

---

## 1. Backend en Render

### Crear el servicio

1. Entrar a https://render.com y crear una cuenta con GitHub.
2. **New** > **Web Service**.
3. Conectar el repositorio `Policonecta` y autorizar el acceso.
4. Completar la configuracion:

| Campo | Valor |
|---|---|
| Name | `policonecta-api` |
| Language | `Docker` |
| Branch | `main` |
| Root Directory | `backend` |
| Instance Type | `Free` |

> El campo **Root Directory** es imprescindible: sin el, Render busca el Dockerfile en la raiz
> del repositorio y falla.

### Variables de entorno

En la seccion **Environment Variables**, agregar una por una:

```ini
APP_NAME=PoliConecta
APP_ENV=production
APP_KEY=(la del .env local, generada con php artisan key:generate)
APP_DEBUG=false

DB_CONNECTION=pgsql
DB_HOST=(el host del Session pooler de Supabase)
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=(el usuario de Supabase)
DB_PASSWORD=(la contrasena de Supabase)
DB_SSLMODE=require

SUPABASE_URL=(la URL del proyecto de Supabase)
SUPABASE_SERVICE_KEY=(la clave service_role)
SUPABASE_BUCKET=events

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=stderr
```

`FRONTEND_URL` se agrega despues, cuando exista la direccion de Vercel.

5. Pulsar **Create Web Service**. El primer despliegue tarda entre 5 y 10 minutos.

Al terminar, Render entrega una direccion como `https://policonecta-api.onrender.com`.
Para comprobar que funciona, abrir en el navegador:

```text
https://policonecta-api.onrender.com/api/events
```

Debe devolver el listado de eventos en JSON.

> **Importante:** en el plan gratuito el servidor se suspende tras 15 minutos sin uso. La
> siguiente visita tarda cerca de un minuto en responder mientras vuelve a arrancar. No es un
> error, es una limitacion del plan.

---

## 2. Frontend en Vercel

1. Entrar a https://vercel.com y crear una cuenta con GitHub.
2. **Add New** > **Project** e importar el repositorio `Policonecta`.
3. Configurar:

| Campo | Valor |
|---|---|
| Framework Preset | `Vite` |
| Root Directory | `frontend` |

4. En **Environment Variables**, agregar:

```ini
VITE_API_URL=https://policonecta-api.onrender.com/api
```

Debe terminar en `/api` y no llevar barra final.

5. Pulsar **Deploy**. Tarda uno o dos minutos.

Vercel entrega una direccion como `https://policonecta.vercel.app`.

---

## 3. Conectar los dos

El navegador bloquea las peticiones entre dominios distintos si el servidor no las autoriza. Hay
que indicarle al backend cual es el dominio del frontend.

1. Volver a Render, entrar al servicio y abrir **Environment**.
2. Agregar la variable:

```ini
FRONTEND_URL=https://policonecta.vercel.app
```

3. Guardar. Render vuelve a desplegar automaticamente.

Si mas adelante se agregan mas dominios, se separan con comas.

---

## Comprobacion final

Abrir la direccion de Vercel y verificar:

- El catalogo muestra los eventos
- Se puede iniciar sesion
- Se puede entrar al detalle de un evento e inscribirse
- Las imagenes se ven

Si el catalogo dice "No se pudieron cargar los eventos":

1. Abrir la direccion del backend en el navegador y esperar a que despierte.
2. Revisar que `VITE_API_URL` termine en `/api`.
3. Revisar que `FRONTEND_URL` en Render coincida exactamente con el dominio de Vercel.

Los errores de conexion se ven en la consola del navegador con la tecla **F12**.

---

## Actualizaciones

Ambos servicios vuelven a desplegar solos con cada `git push` a la rama `main`. No hay que repetir
la configuracion.

Render no ejecuta las migraciones. Cuando un cambio agrega migraciones nuevas, se aplican a Supabase
desde el equipo local, con el `.env` apuntando a Supabase:

```bash
php artisan migrate
```

No usar `migrate:fresh`, porque borra todos los datos.
