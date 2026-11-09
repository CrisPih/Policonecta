import { useState, useEffect } from 'react';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';
import { estadoEvento, descargarICS, esOportunidad, fechaLarga, TIPOS } from '../utils/eventDates';

// Detalle de un evento e inscripción de participantes -- Cristina Pihuave
export default function EventDetailPage({ eventId, setCurrentPage, user }) {
    const [event, setEvent] = useState(null);
    const [registered, setRegistered] = useState(0);
    const [available, setAvailable] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imgError, setImgError] = useState(false);

    // Datos del formulario de inscripción
    const [form, setForm] = useState({ name: '', email: '' });
    const [sending, setSending] = useState(false);
    const [formError, setFormError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Inscripción existente del usuario en este evento
    const [miInscripcion, setMiInscripcion] = useState(null);
    const [copiado, setCopiado] = useState(false);

    // Carga el detalle del evento desde la API
    const fetchEvent = async () => {
        try {
            setLoading(true);
            const data = await eventService.getEventById(eventId);
            setEvent(data.event);
            setRegistered(data.registered_participants);
            setAvailable(data.available_spots);
            setError(null);
        } catch (err) {
            console.error('Error al cargar el evento:', err);
            setError('No se pudo cargar la información del evento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) fetchEvent();
    }, [eventId]);

    // Si hay sesión iniciada se completan los datos del participante
    useEffect(() => {
        if (user) {
            setForm({ name: user.name || '', email: user.email || '' });
        }
    }, [user]);

    // Revisa si el usuario ya se encuentra inscrito en este evento
    useEffect(() => {
        const buscarInscripcion = async () => {
            if (!user?.email || !eventId) return;

            try {
                const misInscripciones = await registrationService.getByParticipant(user.email);
                const encontrada = misInscripciones.find(
                    (r) => String(r.event_id) === String(eventId)
                );
                setMiInscripcion(encontrada || null);
            } catch (err) {
                console.error('Error al verificar la inscripción:', err);
            }
        };

        buscarInscripcion();
    }, [user, eventId, success]);

    // Cancela la inscripción desde el detalle del evento
    const handleCancelar = async () => {
        if (!miInscripcion) return;

        const confirmar = window.confirm('¿Desea cancelar su participación?');
        if (!confirmar) return;

        try {
            setSending(true);
            const data = await registrationService.cancel(event.id, miInscripcion.id);

            setMiInscripcion(null);
            setSuccess(null);
            setAvailable(data.available_spots);
            setRegistered((n) => Math.max(n - 1, 0));
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSending(false);
        }
    };

    // Enlace directo a este evento
    const enlaceEvento = () => `${window.location.origin}/?evento=${eventId}`;

    // Comparte el evento por WhatsApp
    const compartirWhatsApp = () => {
        const texto = `${event.title} - ${event.location}\n${enlaceEvento()}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    };

    // Copia el enlace del evento al portapapeles
    const copiarEnlace = async () => {
        try {
            await navigator.clipboard.writeText(enlaceEvento());
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch (err) {
            console.error('No se pudo copiar el enlace:', err);
        }
    };

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    // Envía la inscripción al backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setSuccess(null);

        if (!form.name.trim() || !form.email.trim()) {
            setFormError('Ingrese su nombre y correo para inscribirse.');
            return;
        }

        try {
            setSending(true);
            const data = await registrationService.register(event.id, {
                name: form.name.trim(),
                email: form.email.trim(),
            });

            setSuccess(data.message);
            setAvailable(data.available_spots);
            setRegistered((n) => n + 1);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSending(false);
        }
    };

    // Formatea fechas locales para evitar desfases de zona horaria.
    const formatDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return '';

        const [year, month, day] = dateStr.split('T')[0].split('-');
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        if (!year || !month || !day || !meses[Number(month) - 1]) return '';
        return `${Number(day)} de ${meses[Number(month) - 1]} de ${year}`;
    };

    const formatDateRange = (startDate, endDate) => {
        const start = formatDate(startDate);
        const end = formatDate(endDate);

        if (!start) return 'Fecha por confirmar';
        if (!end || startDate === endDate) return start;
        return `${start} al ${end}`;
    };

    const formatTime = (start, end) => {
        const s = start ? start.slice(0, 5) : '';
        const e = end ? end.slice(0, 5) : '';
        return e ? `${s} a ${e}` : s;
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f3f6fb', padding: '80px 40px', textAlign: 'center', color: '#7a7a7a', fontSize: 14 }}>
                Cargando evento...
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{ minHeight: '100vh', background: '#f3f6fb', padding: '80px 40px', textAlign: 'center' }}>
                <p style={{ color: '#d9534f', fontSize: 14, marginBottom: 20 }}>{error || 'Evento no encontrado.'}</p>
                <button onClick={() => setCurrentPage('home')} style={primaryBtn}>
                    Volver al inicio
                </button>
            </div>
        );
    }

    const total = event.max_participants || 0;
    const sinLimite = event.max_participants == null;
    const pct = total ? Math.round((registered / total) * 100) : 0;
    const sinCupos = !sinLimite && available <= 0;
    const oportunidad = esOportunidad(event);
    const estado = estadoEvento(event);
    const finalizado = estado.clave === 'finalizado';

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div className="pc-gutter" style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 40px 60px' }}>

                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#9a9a9a', marginBottom: 24, display: 'flex', gap: 6 }}>
                    <button
                        type="button"
                        onClick={() => setCurrentPage('home')}
                        style={{ background: 'none', border: 'none', color: '#9a9a9a', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}
                    >
                        Inicio
                    </button>
                    <span>/</span>
                    <span style={{ color: '#4a4a4a' }}>{oportunidad ? TIPOS[event.type] : 'Detalle del evento'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24, alignItems: 'start' }}>

                    {/* Columna principal */}
                    <div style={cardStyle}>
                        {event.image && !imgError ? (
                            <div style={{ width: '100%', height: 260, overflow: 'hidden', background: '#f3f6fb' }}>
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={() => setImgError(true)}
                                />
                            </div>
                        ) : (
                            <ImagePlaceholder height={260} label="Imagen del evento" style={{ borderRadius: 0 }} />
                        )}

                        <div style={{ padding: '24px 26px 28px' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                                {oportunidad && <Tag>{TIPOS[event.type]}</Tag>}
                                {event.faculty && <Tag>{event.faculty}</Tag>}
                                {event.category && <Tag>{event.category}</Tag>}
                                {event.modality && <Tag>{event.modality}</Tag>}
                                <span
                                    style={{
                                        color: estado.color,
                                        border: `1px solid ${estado.color}55`,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                        borderRadius: 3,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    {estado.texto}
                                </span>
                            </div>

                            <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700, color: '#0f1f3d', lineHeight: 1.25 }}>
                                {event.title}
                            </h1>

                            <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
                                <InfoRow
                                    label="Fecha"
                                    value={formatDateRange(event.start_date || event.date, event.end_date || event.fecha_fin)}
                                />
                                <InfoRow label="Horario" value={formatTime(event.start_time, event.end_time)} />
                                <InfoRow label="Ubicación" value={event.location} />
                                <InfoRow label="Organiza" value={event.faculty} />
                                {event.deadline && <InfoRow label="Fecha límite" value={fechaLarga(event.deadline)} />}
                                {event.sponsor && <InfoRow label="Patrocina" value={event.sponsor} />}
                            </div>

                            {event.external_link && (
                                <a
                                    href={event.external_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ ...primaryBtn, display: 'inline-block', textDecoration: 'none', marginBottom: 22 }}
                                >
                                    {oportunidad ? 'Ir a la postulación' : 'Más información'}
                                </a>
                            )}

                            <h2 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>
                                Descripción
                            </h2>
                            <p style={{ margin: 0, fontSize: 13, color: '#5a5a5a', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                {event.description}
                            </p>
                        </div>
                    </div>

                    {/* Columna lateral: cupos e inscripción */}
                    <div style={{ display: 'grid', gap: 16 }}>

                        {!sinLimite && (
                        <div style={{ ...cardStyle, padding: '20px 22px' }}>
                            <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>
                                Disponibilidad
                            </h2>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7a7a7a', marginBottom: 6 }}>
                                <span>{available} cupos disponibles</span>
                                <span>{pct}% lleno</span>
                            </div>
                            <div style={{ height: 4, background: '#efefef', borderRadius: 2, marginBottom: 12 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#1e3a8a' : '#93b0e0', borderRadius: 2 }} />
                            </div>

                            <div style={{ fontSize: 12, color: '#9a9a9a' }}>
                                {registered} de {total} participantes inscritos
                            </div>
                        </div>
                        )}

                        <div style={{ ...cardStyle, padding: '20px 22px' }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>
                                Inscripción
                            </h2>
                            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#7a7a7a', lineHeight: 1.5 }}>
                                {oportunidad ? 'Registre su interés en esta oportunidad.' : 'Reserve su cupo en este evento.'}
                            </p>

                            {success && (
                                <div style={successStyle}>{success}</div>
                            )}

                            {formError && (
                                <div style={errorStyle}>{formError}</div>
                            )}

                            {finalizado ? (
                                <p style={avisoStyle}>{oportunidad ? 'La postulación está cerrada.' : 'Este evento ya finalizó.'}</p>
                            ) : !user ? (
                                <div>
                                    <p style={avisoStyle}>
                                        Inicie sesión para inscribirse.
                                    </p>
                                    <button
                                        onClick={() => setCurrentPage('login')}
                                        style={{ ...primaryBtn, width: '100%' }}
                                    >
                                        Iniciar sesión
                                    </button>
                                </div>
                            ) : miInscripcion ? (
                                <div>
                                    <div style={successStyle}>
                                        Su inscripción está registrada.
                                    </div>
                                    <button
                                        onClick={handleCancelar}
                                        disabled={sending}
                                        style={{
                                            ...dangerBtn,
                                            width: '100%',
                                            opacity: sending ? 0.6 : 1,
                                            cursor: sending ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {sending ? 'Cancelando...' : 'Cancelar mi participación'}
                                    </button>
                                </div>
                            ) : sinCupos && !success ? (
                                <p style={avisoStyle}>
                                    No hay cupos disponibles.
                                </p>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <Field label="Nombre completo">
                                        <input
                                            value={form.name}
                                            onChange={set('name')}
                                            placeholder="Nombre y apellido"
                                            disabled={sending || !!success}
                                            style={inputStyle}
                                        />
                                    </Field>

                                    <Field label="Correo electrónico">
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={set('email')}
                                            placeholder="usuario@espol.edu.ec"
                                            disabled={sending || !!success}
                                            style={inputStyle}
                                        />
                                    </Field>

                                    <button
                                        type="submit"
                                        disabled={sending || !!success}
                                        style={{
                                            ...primaryBtn,
                                            width: '100%',
                                            opacity: sending || success ? 0.6 : 1,
                                            cursor: sending || success ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {sending ? 'Registrando...' : success ? 'Inscripción confirmada' : 'Inscribirme'}
                                    </button>
                                </form>
                            )}

                            {(success || miInscripcion) && (
                                <button
                                    onClick={() => setCurrentPage('my-registrations')}
                                    style={{ ...secondaryBtn, width: '100%', marginTop: 10 }}
                                >
                                    Ver mis inscripciones
                                </button>
                            )}
                        </div>

                        {/* Compartir el evento y agregarlo al calendario */}
                        <div style={{ ...cardStyle, padding: '20px 22px' }}>
                            <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>
                                Compartir
                            </h2>

                            <div style={{ display: 'grid', gap: 8 }}>
                                <button onClick={compartirWhatsApp} style={{ ...secondaryBtn, width: '100%' }}>
                                    Compartir por WhatsApp
                                </button>

                                <button onClick={copiarEnlace} style={{ ...secondaryBtn, width: '100%' }}>
                                    {copiado ? 'Enlace copiado' : 'Copiar enlace'}
                                </button>

                                {!finalizado && (
                                    <button
                                        onClick={() => descargarICS(event)}
                                        style={{ ...secondaryBtn, width: '100%' }}
                                    >
                                        Agregar a mi calendario
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
            <span style={{ minWidth: 84, color: '#9a9a9a' }}>{label}</span>
            <span style={{ color: '#3a3a3a', fontWeight: 500 }}>{value}</span>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#5a5a5a', fontWeight: 500 }}>{label}</label>
            {children}
        </div>
    );
}

function Tag({ children }) {
    return (
        <span
            style={{
                background: '#efefef',
                color: '#5a5a5a',
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
            }}
        >
            {children}
        </span>
    );
}

const cardStyle = {
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    overflow: 'hidden',
};

const inputStyle = {
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '9px 11px',
    fontSize: 13,
    color: '#0f1f3d',
    background: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
};

const primaryBtn = {
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '10px 18px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.03em',
};

const secondaryBtn = {
    background: 'none',
    color: '#5a5a5a',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '9px 18px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
};

const dangerBtn = {
    background: 'none',
    color: '#a94442',
    border: '1px solid #e0b4b4',
    borderRadius: 4,
    padding: '10px 18px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
};

const successStyle = {
    background: '#edf7ed',
    color: '#1e4620',
    border: '1px solid #c3e6cb',
    padding: '10px 12px',
    borderRadius: 4,
    fontSize: 12,
    marginBottom: 14,
    fontWeight: 600,
};

const errorStyle = {
    background: '#fdecea',
    color: '#611a15',
    border: '1px solid #f5c6cb',
    padding: '10px 12px',
    borderRadius: 4,
    fontSize: 12,
    marginBottom: 14,
};

// Aviso sencillo, sin recuadro
const avisoStyle = {
    margin: '0 0 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#3a3a3a',
    lineHeight: 1.5,
};
