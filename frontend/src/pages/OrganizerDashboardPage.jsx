import { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';

// -- Cristina Pihuave
// Panel del organizador: edición, eliminación y participantes
export default function OrganizerDashboardPage({ setCurrentPage }) {
    const [events, setEvents] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Evento cuyo listado de participantes está desplegado
    const [openId, setOpenId] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    
    const fetchEvents = async () => {
        try {
            setLoading(true);
            
            // 1. Preparar parámetros de consulta con user_id si está disponible
            const paramsPublished = { status: 'published' };
            const paramsDraft = { status: 'draft' };

            if (currentUser?.id) {
                paramsPublished.user_id = currentUser.id;
                paramsDraft.user_id = currentUser.id;
            }

            // 2. Cargar publicados y borradores en paralelo
            const [publishedRes, draftsRes] = await Promise.all([
                eventService.getEvents(paramsPublished),
                eventService.getEvents(paramsDraft)
            ]);
            

            // Normalizar las respuestas (extrae .events o usa el array directo)
            const publishedList = Array.isArray(publishedRes) 
                ? publishedRes 
                : (publishedRes?.events || []);

            const draftsList = Array.isArray(draftsRes) 
                ? draftsRes 
                : (draftsRes?.events || []);

            // 3. Unificar y eliminar duplicados por ID mediante Map
            const eventsMap = new Map();
            [...draftsList, ...publishedList].forEach((item) => {
                if (item && item.id) {
                    eventsMap.set(item.id, item);
                }
            });

            const combinedEvents = Array.from(eventsMap.values());
            
            // 4. Filtrar por autor de forma segura 
            const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;

            const myEvents = currentUserIdStr 
                ? combinedEvents.filter((e) => {
                    const eventUserId = e.user_id ?? e.organizer_id ?? e.created_by ?? e.user?.id;
                    // Solo incluir el evento si coincide exactamente el user_id
                    return eventUserId && String(eventUserId) === currentUserIdStr;
                })
                : []; // Si no hay usuario logueado, no mostrar nada en el panel de organizador

            setEvents(myEvents);
            setError(null);
        } catch (err) {
            console.error('Error al cargar eventos:', err);
            setError('No se pudieron cargar los eventos del organizador.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Elimina el evento tras confirmar
    const handleDelete = async (event) => {
        const confirmar = window.confirm(
            `¿Eliminar el evento "${event.title || 'sin título'}"? También se eliminarán sus inscripciones.`
        );
        if (!confirmar) return;

        try {
            setDeletingId(event.id);
            setMessage(null);
            const data = await eventService.deleteEvent(event.id);

            setEvents((list) => list.filter((e) => e.id !== event.id));
            setMessage(data?.message || 'Evento eliminado correctamente.');
            setError(null);
        } catch (err) {
            setError(err.message || 'Error al eliminar el evento.');
        } finally {
            setDeletingId(null);
        }
    };

    // Muestra u oculta los participantes de un evento
    const toggleParticipants = async (eventId) => {
        if (openId === eventId) {
            setOpenId(null);
            return;
        }

        try {
            setOpenId(eventId);
            setLoadingParticipants(true);
            const data = await registrationService.getByEvent(eventId);
            const list = Array.isArray(data) ? data : (data?.registrations || []);
            setParticipants(list);
        } catch (err) {
            setError(err.message || 'Error al cargar participantes.');
            setParticipants([]);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Sin fecha';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // Clasificación estricta de borradores y publicados
    const draftEvents = events.filter((e) => e.status === 'draft');
    const publishedEvents = events.filter((e) => e.status === 'published' || !e.status);

    // Renderizador de tarjeta de evento reutilizable
    const renderEventCard = (event) => {
        const isDraft = event.status === 'draft';

        return (
            <div key={event.id} style={cardStyle}>
                <div style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>
                                {event.title || 'Evento sin título'}
                            </h3>
                            <span style={isDraft ? draftBadgeStyle : publishedBadgeStyle}>
                                {isDraft ? 'Borrador' : 'Publicado'}
                            </span>
                        </div>
                        
                        <div style={{ fontSize: 12, color: '#7a7a7a' }}>
                            {formatDate(event.start_date || event.date)} - {event.location || 'Ubicación no especificada'} - {event.faculty || 'Sin facultad'}
                        </div>
                        <div style={{ fontSize: 12, color: '#9a9a9a', marginTop: 3 }}>
                            Capacidad: {event.max_participants || 0} participantes
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {!isDraft && (
                            <button onClick={() => toggleParticipants(event.id)} style={secondaryBtn}>
                                {openId === event.id ? 'Ocultar' : 'Participantes'}
                            </button>
                        )}
                        <button onClick={() => setCurrentPage('event-detail', event.id)} style={secondaryBtn}>
                            Ver
                        </button>
                        <button onClick={() => setCurrentPage('edit-event', event.id)} style={secondaryBtn}>
                            Editar
                        </button>
                        <button
                            onClick={() => handleDelete(event)}
                            disabled={deletingId === event.id}
                            style={{
                                ...dangerBtn,
                                opacity: deletingId === event.id ? 0.6 : 1,
                                cursor: deletingId === event.id ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {deletingId === event.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                    </div>
                </div>

                {/* Listado de participantes inscritos */}
                {openId === event.id && !isDraft && (
                    <div style={{ borderTop: '1px solid #e5e5e5', padding: '16px 20px', background: '#fafafa' }}>
                        {loadingParticipants ? (
                            <div style={{ fontSize: 12, color: '#7a7a7a' }}>Cargando participantes...</div>
                        ) : participants.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#9a9a9a' }}>
                                Sin inscritos
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Nombre</th>
                                        <th style={thStyle}>Correo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map((p) => (
                                        <tr key={p.id || p.email}>
                                            <td style={tdStyle}>{p.name}</td>
                                            <td style={tdStyle}>{p.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 40px 60px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                            Panel del organizador
                        </h1>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>
                            Publicaciones, borradores e inscritos de su unidad.
                        </p>
                    </div>
                    <button onClick={() => setCurrentPage('create-event')} style={primaryBtn}>
                        Crear publicación
                    </button>
                </div>

                {message && <div style={successStyle}>{message}</div>}
                {error && <div style={errorStyle}>{error}</div>}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a7a7a', fontSize: 14 }}>
                        Cargando publicaciones...
                    </div>
                )}

                {!loading && events.length === 0 && !error && (
                    <div style={emptyStyle}>
                        <p style={{ fontSize: 14, color: '#7a7a7a', margin: 0 }}>
                            Sin publicaciones
                        </p>
                    </div>
                )}

                {!loading && events.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                        {/* SECCIÓN 1: BORRADORES */}
                        {draftEvents.length > 0 && (
                            <section>
                                <div style={sectionHeaderStyle}>
                                    <h2 style={sectionTitleStyle}>Borradores</h2>
                                    <span style={countBadgeStyle}>{draftEvents.length}</span>
                                </div>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {draftEvents.map(renderEventCard)}
                                </div>
                            </section>
                        )}

                        {/* LÍNEA DIVISORIA DECORATIVA */}
                        {draftEvents.length > 0 && publishedEvents.length > 0 && (
                            <div style={dividerContainerStyle}>
                                <hr style={dividerLineStyle} />
                            </div>
                        )}

                        {/* SECCIÓN 2: PUBLICADOS */}
                        {publishedEvents.length > 0 && (
                            <section>
                                <div style={sectionHeaderStyle}>
                                    <h2 style={sectionTitleStyle}>Publicadas</h2>
                                    <span style={countBadgeStyle}>{publishedEvents.length}</span>
                                </div>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {publishedEvents.map(renderEventCard)}
                                </div>
                            </section>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}

// Estilos
const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
};

const sectionTitleStyle = {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1e40af',
    letterSpacing: '-0.01em',
};

const countBadgeStyle = {
    background: '#e0e0e0',
    color: '#4a4a4a',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
};

const draftBadgeStyle = {
    background: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeeba',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
};

const publishedBadgeStyle = {
    background: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
};

const dividerContainerStyle = {
    margin: '8px 0',
    display: 'flex',
    alignItems: 'center',
};

const dividerLineStyle = {
    border: 'none',
    borderTop: '1px dashed #d0d0d0',
    width: '100%',
};

const cardStyle = {
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    overflow: 'hidden',
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
    padding: '8px 14px',
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
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
};

const thStyle = {
    textAlign: 'left',
    padding: '6px 8px',
    color: '#9a9a9a',
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: '0.06em',
    borderBottom: '1px solid #e5e5e5',
};

const tdStyle = {
    padding: '8px',
    color: '#3a3a3a',
    borderBottom: '1px solid #efefef',
};

const successStyle = {
    background: '#edf7ed',
    color: '#1e4620',
    border: '1px solid #c3e6cb',
    padding: '11px 14px',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 16,
    fontWeight: 600,
};

const errorStyle = {
    background: '#fdecea',
    color: '#611a15',
    border: '1px solid #f5c6cb',
    padding: '11px 14px',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 16,
};

const emptyStyle = {
    textAlign: 'center',
    padding: '70px 20px',
    background: '#fff',
    border: '1px dashed #d4d4d4',
    borderRadius: 4,
};