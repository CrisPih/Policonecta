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
| Carrusel de destacados | Publicaciones patrocinadas por un plan pagado de 7, 15 o 30 días. |
| Motor de recomendaciones | Ordena las publicaciones según facultad, carrera, intereses, historial de asistencia y fechas límite. |
| Oportunidades | Sección propia con fecha límite de postulación y enlace externo. |
| Buscador con filtros | Búsqueda por palabras clave y filtros por tipo, facultad, categoría y fecha. |
| Inscripciones | Registro en un paso con los datos del perfil, control de cupos y cancelación. |
| Entradas pagadas | Eventos con precio; el pago se confirma antes de reservar el cupo y se reembolsa al cancelar. |
| Asistencia por QR | Credencial con código QR por inscripción, leída con la cámara en la entrada del evento. |
| Programa de puntos | 10 puntos por cada asistencia registrada, canjeables por recompensas. |

### Recompensas

El canje es una simulación: genera un cupón con código y descuenta los puntos.

| Recompensa | Puntos | Uso del cupón |
|---|---|---|
| 10 % de descuento en ESPOL Shop | 30 | Se presenta el código en la tienda |
| Comida gratis en un bar del campus | 20 | Se presenta el código en el bar |
| Entrada gratis a un evento pagado | 50 | Se aplica al comprar la entrada y el total queda en $0 |

También se agregan cupones sin gastar puntos con un código promocional en "Mis cupones":

| Código | Cupón |
|---|---|
| `BIENVENIDA2026` | Entrada gratis a un evento pagado |
| `ESPOLSHOP10` | 10 % de descuento en ESPOL Shop |
| `BARPOLI` | Comida gratis en un bar del campus |
| Valoración de eventos | Calificación de 1 a 5 y comentario de quienes asistieron. |
| Avisos | Publicaciones afines al perfil, recordatorios de eventos, cierres de postulación y valoraciones pendientes. |
| Calendario | Vista mensual y descarga del evento para Google Calendar u Outlook. |
| Panel del organizador | Creación, edición, borradores, inscritos, aviso de cruce de horarios y publicación destacada. |
| Tablero de métricas | Inscripción, asistencia, valoración e ingresos por publicación, facultad y carrera, con exportación a CSV. |

### Pagos simulados

Los pagos de entradas y de publicaciones destacadas usan una pasarela simulada que no se conecta a ningún banco ni guarda el número de la tarjeta.

| Tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | Pago aprobado |
| `4000 0000 0000 0002` | Pago rechazado |

Cualquier fecha de vencimiento futura y cualquier CVV de 3 dígitos son válidos.

### Versión web y versión móvil

La versión web ofrece todas las funciones. En pantallas de teléfono el participante consulta publicaciones, se inscribe, muestra su credencial QR y revisa su perfil, y el organizador registra la asistencia con la cámara. La creación y gestión de publicaciones solo está disponible en la versión web.

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

El participante de prueba empieza con 60 puntos para demostrar el canje.

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
| `GET` | `/events/conflicts` | Eventos de la misma facultad en el mismo horario | No |
| `GET` | `/featured-plans` | Planes de publicación destacada | No |
| `GET` | `/events/{id}/ratings` | Valoraciones de un evento | No |
| `GET` | `/events/{id}` | Detalle de una publicación | No |
| `POST` | `/events` | Crear una publicación | Sí |
| `PUT` / `PATCH` | `/events/{id}` | Actualizar una publicación | Sí |
| `DELETE` | `/events/{id}` | Eliminar una publicación | Sí |
| `GET` | `/profile` | Consultar el perfil | Sí |
| `PUT` | `/profile` | Actualizar facultad, carrera e intereses | Sí |
| `GET` | `/recommendations` | Recomendaciones personalizadas | Sí |
| `POST` | `/events/{id}/feature` | Pagar un plan de publicación destacada | Sí |
| `GET` | `/payments` | Historial de pagos | Sí |
| `POST` | `/events/{id}/attendance` | Registrar asistencia con el código QR | Sí |
| `POST` | `/events/{id}/ratings` | Valorar un evento al que se asistió | Sí |
| `GET` | `/notifications` | Avisos del usuario | Sí |
| `POST` | `/notifications/read` | Marcar los avisos como leídos | Sí |
| `GET` | `/organizer/stats` | Métricas del organizador | Sí |
| `GET` | `/rewards` | Puntos, catálogo de recompensas y cupones | Sí |
| `POST` | `/rewards/{clave}/redeem` | Canjear puntos (`shop`, `bar` o `entrada`) | Sí |
| `POST` | `/rewards/claim` | Agregar un cupón con un código promocional | Sí |
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
- Acuerdos reales con ESPOL Shop y los bares del campus para validar los cupones.
- Pasarela de pago real para entradas y publicaciones destacadas.
- Aplicaciones nativas, notificaciones push y correo semanal de recomendaciones.
