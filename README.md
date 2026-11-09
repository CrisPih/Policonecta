# PoliConecta

Plataforma centralizada de eventos y oportunidades de la ESPOL.

Reúne en un solo lugar los eventos, pasantías, becas, proyectos de investigación y convocatorias de la comunidad politécnica, y recomienda a cada usuario las publicaciones afines a su facultad, sus intereses y su historial de asistencia.

Proyecto de la materia Sistemas de la Información, paralelo 2, PAO 2 2026. Profesor: Luis Eduardo Mendoza Morales.

**Integrantes:** Domenika Arboleda Alvarado, Vanessa Celi Castro, Dhamar Patiño Castro, Cristina Pihuave Gómez, María de los Ángeles Pincay Tapia, Enrique Rosado Alcívar y Pauleth Tandazo Sarango.

---

## Aplicación en línea

- Frontend: `https://policonecta.vercel.app`
- API: `https://policonecta-api.onrender.com/api`

> El backend usa el plan gratuito de Render, que se suspende tras 15 minutos sin uso. La primera visita puede tardar hasta un minuto.

---

## Tecnologías

| Componente | Herramientas | Despliegue |
|---|---|---|
| Backend | PHP 8.2, Laravel, API REST, Sanctum | Render |
| Frontend | React, Vite | Vercel |
| Base de datos | PostgreSQL | Supabase |
| Imágenes | Supabase Storage | Supabase |

---

## Funcionalidades

| Módulo | Descripción |
|---|---|
| Portal centralizado | Eventos, pasantías, becas, investigación y convocatorias en un mismo catálogo. |
| Carrusel de destacados | Publicaciones patrocinadas que se muestran en el inicio hasta la fecha indicada. |
| Motor de recomendaciones | Ordena las publicaciones según facultad, intereses, historial de asistencia y fechas límite. |
| Oportunidades | Sección propia con fecha límite de postulación y enlace externo. |
| Buscador con filtros | Búsqueda por palabras clave y filtros por tipo, facultad, categoría y fecha. |
| Inscripciones | Registro en un paso, control de cupos y cancelación. |
| Calendario | Vista mensual y descarga del evento para Google Calendar u Outlook. |
| Panel del organizador | Creación, edición, borradores y lista de inscritos. |

### Versión web y versión móvil

La versión web ofrece todas las funciones. En pantallas de teléfono la plataforma se limita a consultar publicaciones, inscribirse y revisar el perfil; la creación y gestión de publicaciones solo está disponible en la versión web.

### Roles

| Rol | Permisos |
|---|---|
| Visitante | Consulta el catálogo, el calendario y el detalle de cada publicación. |
| Participante | Además se inscribe, registra sus intereses y recibe recomendaciones. |
| Organizador | Además publica y administra eventos y oportunidades desde la versión web. |

---

## Ejecución local

Requisitos: PHP 8.2 o superior (con `pdo_pgsql`, `pgsql`, `zip`, `mbstring`, `openssl`, `curl`, `intl` y `gd`), Composer y Node.js 18 o superior.

### 1. Clonar el repositorio

```bash
git clone https://github.com/CrisPih/Policonecta.git
```

### 2. Backend

```bash
cd Policonecta/backend
```

```bash
composer install
```

```bash
cp .env.example .env
```

```bash
php artisan key:generate
```

Completar en `.env` los datos de Supabase (ver [docs/SUPABASE.md](docs/SUPABASE.md)). Para trabajar sin Supabase, cambiar `DB_CONNECTION=sqlite`, borrar las demás líneas `DB_` y crear el archivo `database/database.sqlite`.

```bash
php artisan migrate --seed
```

```bash
php artisan serve
```

La API queda en `http://localhost:8000/api`.

### 3. Frontend

En otra terminal, desde la raíz del proyecto:

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

La aplicación queda en `http://localhost:5173`.

### Cuentas de demostración

El comando `php artisan migrate --seed` crea dos cuentas y publicaciones de ejemplo:

| Rol | Correo | Contraseña |
|---|---|---|
| Organizador | `organizador@policonecta.test` | `policonecta123` |
| Participante | `estudiante@policonecta.test` | `policonecta123` |

---

## Pruebas

Desde `backend/`:

```bash
php artisan test
```

Se ejecutan sobre SQLite en memoria y no modifican los datos de Supabase.

---

## Endpoints

Ruta base `/api`. La colección de Postman está en [docs/postman/PoliConecta.postman_collection.json](docs/postman/PoliConecta.postman_collection.json).

| Método | Endpoint | Descripción | Sesión |
|---|---|---|---|
| `POST` | `/register` | Crear una cuenta | No |
| `POST` | `/login` | Iniciar sesión | No |
| `GET` | `/events` | Listar, buscar y filtrar (`search`, `type`, `kind`, `faculty`, `category`, `date`) | No |
| `GET` | `/events/featured` | Publicaciones destacadas vigentes | No |
| `GET` | `/events/{id}` | Detalle de una publicación | No |
| `POST` | `/events` | Crear una publicación | Sí |
| `PUT` / `PATCH` | `/events/{id}` | Actualizar una publicación | Sí |
| `DELETE` | `/events/{id}` | Eliminar una publicación | Sí |
| `GET` | `/profile` | Consultar el perfil | Sí |
| `PUT` | `/profile` | Actualizar facultad, carrera e intereses | Sí |
| `GET` | `/recommendations` | Recomendaciones personalizadas | Sí |
| `GET` | `/events/{id}/registrations` | Inscritos de una publicación | Sí |
| `POST` | `/events/{id}/registrations` | Inscribirse | Sí |
| `DELETE` | `/events/{id}/registrations/{id}` | Cancelar la inscripción | Sí |
| `GET` | `/registrations?email=` | Inscripciones de un participante | Sí |

### Tipos de publicación

`evento`, `pasantia`, `beca`, `investigacion` y `convocatoria`. Las oportunidades exigen `deadline` (fecha límite) y no exigen horario, lugar ni cupos.

---

## Despliegue

Los pasos para publicar en Supabase, Render y Vercel están en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

---

## Funciones previstas

Dependen de acuerdos con la ESPOL y no forman parte de esta versión:

- Ingreso con la cuenta institucional (SSO de GTSI).
- Asistencia por código QR y puntos canjeables.
- Valoración de eventos por los asistentes.
- Alerta de cruce de horarios entre eventos dirigidos al mismo público.
- Notificaciones push y correo semanal de recomendaciones.
