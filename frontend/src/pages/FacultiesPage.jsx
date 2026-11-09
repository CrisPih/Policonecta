import { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';

// Listado de facultades con sus eventos publicados -- Cristina Pihuave
const FACULTIES = [
    { id: 'FIEC', name: 'Facultad de Ingeniería en Electricidad y Computación' },
    { id: 'FIMCP', name: 'Facultad de Ingeniería Mecánica y Ciencias de la Producción' },
    { id: 'FCNM', name: 'Facultad de Ciencias Naturales y Matemáticas' },
    { id: 'FCSH', name: 'Facultad de Ciencias Sociales y Humanísticas' },
    { id: 'FADCOM', name: 'Facultad de Arte, Diseño y Comunicación Audiovisual' },
    { id: 'FICT', name: 'Facultad de Ingeniería en Ciencias de la Tierra' },
];

export default function FacultiesPage({ setCurrentPage }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventService.getEvents();
                setEvents(data);
            } catch (err) {
                console.error('Error al cargar eventos:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Cuenta los eventos publicados de una facultad
    const contarEventos = (id) => events.filter((e) => e.faculty === id).length;

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px 60px' }}>

                <div style={{ marginBottom: 26 }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                        Facultades
                    </h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>
                        Publicaciones de cada unidad académica de la ESPOL.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {FACULTIES.map((fac) => {
                        const total = contarEventos(fac.id);

                        return (
                            <div
                                key={fac.id}
                                onClick={() => setCurrentPage('home', fac.id)}
                                style={cardStyle}
                                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={badgeStyle}>{fac.id}</span>
                                    <span style={{ fontSize: 11, color: '#9a9a9a' }}>
                                        {loading
                                            ? '...'
                                            : `${total} evento${total !== 1 ? 's' : ''}`}
                                    </span>
                                </div>

                                <div style={{ fontSize: 13, color: '#3a3a3a', lineHeight: 1.5, marginBottom: 14 }}>
                                    {fac.name}
                                </div>

                                <div style={{ fontSize: 12, color: '#5a5a5a', fontWeight: 600 }}>
                                    Ver eventos →
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const cardStyle = {
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
};

const badgeStyle = {
    background: '#1e40af',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 3,
    letterSpacing: '0.06em',
};
