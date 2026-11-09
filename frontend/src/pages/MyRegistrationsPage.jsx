import { useState, useEffect } from 'react';
import { registrationService } from '../services/registrationService';

// Consulta y cancelación de las inscripciones del participante -- Cristina Pihuave
export default function MyRegistrationsPage({ user, setCurrentPage }) {
    const [consulted, setConsulted] = useState(!!user?.email);

    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [cancelingId, setCancelingId] = useState(null);

    // Consulta las inscripciones asociadas al correo
    const fetchRegistrations = async (correo) => {
        if (!correo) return;

        try {
            setLoading(true);
            const data = await registrationService.getByParticipant(correo);
            setRegistrations(data);
            setError(null);
        } catch (err) {
            console.error('Error al cargar inscripciones:', err);
            setError('No se pudieron cargar sus inscripciones.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.email) {
            setConsulted(true);
            fetchRegistrations(user.email);
        }
    }, [user]);

    // Cancela una inscripción y actualiza el listado
    const handleCancel = async (registration) => {
        const confirmar = window.confirm(
            `¿Desea cancelar su participación en "${registration.event?.title || 'este evento'}"?`
        );
        if (!confirmar) return;

        try {
            setCancelingId(registration.id);
            setMessage(null);
            const data = await registrationService.cancel(registration.event_id, registration.id);

            setRegistrations((list) => list.filter((r) => r.id !== registration.id));
            setMessage(data.message);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setCancelingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Fecha por confirmar';
        const [year, month, day] = dateStr.split('-');
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${parseInt(day, 10)} de ${meses[parseInt(month, 10) - 1]} de ${year}`;
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 40px 60px' }}>

                <div style={{ marginBottom: 26 }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                        Mis inscripciones
                    </h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>
                        Eventos y oportunidades en los que está inscrito.
                    </p>
                </div>

                {/* La consulta de inscripciones requiere sesion iniciada */}
                {!user?.email && (
                    <div style={{ ...cardStyle, padding: '40px 20px', marginBottom: 20, textAlign: 'center' }}>
                        <p style={{ fontSize: 14, color: '#7a7a7a', margin: '0 0 16px' }}>
                            Inicie sesión para ver sus inscripciones.
                        </p>
                        <button onClick={() => setCurrentPage('login')} style={primaryBtn}>
                            Iniciar sesión
                        </button>
                    </div>
                )}

                {message && <div style={successStyle}>{message}</div>}
                {error && <div style={errorStyle}>{error}</div>}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a7a7a', fontSize: 14 }}>
                        Cargando inscripciones...
                    </div>
                )}

                {!loading && consulted && registrations.length === 0 && !error && (
                    <div style={emptyStyle}>
                        <p style={{ fontSize: 14, color: '#7a7a7a', margin: 0 }}>
                            Sin inscripciones
                        </p>
                    </div>
                )}

                {!loading && registrations.length > 0 && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {registrations.map((r) => (
                            <div key={r.id} style={{ ...cardStyle, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 240 }}>
                                    <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#0f1f3d' }}>
                                        {r.event?.title || 'Evento no disponible'}
                                    </h3>
                                    <div style={{ fontSize: 12, color: '#7a7a7a', marginBottom: 3 }}>
                                        {formatDate(r.event?.date)}
                                        {r.event?.start_time ? ` - ${r.event.start_time.slice(0, 5)}` : ''}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#7a7a7a' }}>
                                        {r.event?.location || 'Ubicación por confirmar'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => setCurrentPage('event-detail', r.event_id)}
                                        style={secondaryBtn}
                                    >
                                        Ver evento
                                    </button>
                                    <button
                                        onClick={() => handleCancel(r)}
                                        disabled={cancelingId === r.id}
                                        style={{
                                            ...dangerBtn,
                                            opacity: cancelingId === r.id ? 0.6 : 1,
                                            cursor: cancelingId === r.id ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {cancelingId === r.id ? 'Cancelando...' : 'Cancelar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const cardStyle = {
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
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
