import { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import { eventService } from '../services/eventService';

// Clubes estudiantiles y sus publicaciones
export default function ClubsPage({ setCurrentPage }) {
    const [clubes, setClubes] = useState(null);
    const [elegido, setElegido] = useState(null);
    const [eventos, setEventos] = useState(null);

    useEffect(() => {
        eventService.getClubs().then(setClubes).catch(() => setClubes([]));
    }, []);

    const abrir = async (club) => {
        setElegido(club);
        setEventos(null);
        window.scrollTo(0, 0);
        try {
            const data = await eventService.getClub(club.id);
            setEventos(data.events ?? []);
        } catch {
            setEventos([]);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div className="pc-gutter" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px 60px' }}>
                {elegido ? (
                    <>
                        <button
                            onClick={() => setElegido(null)}
                            style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: 'inherit' }}
                        >
                            Todos los clubes
                        </button>

                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                            <Sigla texto={elegido.acronym || elegido.name} grande />
                            <div>
                                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>{elegido.acronym || elegido.name}</h1>
                                <div style={{ fontSize: 13, color: '#3b4a66' }}>
                                    {elegido.name}{elegido.faculty ? ` - ${elegido.faculty}` : ''}
                                </div>
                            </div>
                        </div>
                        {elegido.description && (
                            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#5a5a5a', maxWidth: 720, lineHeight: 1.6 }}>{elegido.description}</p>
                        )}

                        <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#0f1f3d' }}>Publicaciones del club</h2>
                        {eventos === null ? (
                            <p style={{ fontSize: 13, color: '#7a7a7a' }}>Cargando publicaciones...</p>
                        ) : eventos.length === 0 ? (
                            <p style={{ fontSize: 14, color: '#9a9a9a' }}>Sin publicaciones</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                                {eventos.map((ev) => (
                                    <EventCard key={ev.id} event={ev} compacto onSelect={() => setCurrentPage('event-detail', ev.id)} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: 26 }}>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>Clubes</h1>
                            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>
                                Clubes y organizaciones estudiantiles de la ESPOL.
                            </p>
                        </div>

                        {clubes === null ? (
                            <p style={{ fontSize: 13, color: '#7a7a7a' }}>Cargando clubes...</p>
                        ) : clubes.length === 0 ? (
                            <p style={{ fontSize: 14, color: '#9a9a9a' }}>Sin clubes registrados</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
                                {clubes.map((club) => (
                                    <button
                                        key={club.id}
                                        onClick={() => abrir(club)}
                                        style={{ textAlign: 'left', background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                                    >
                                        <Sigla texto={club.acronym || club.name} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d' }}>{club.acronym || club.name}</span>
                                                <span style={{ fontSize: 11, color: '#7a7a7a', whiteSpace: 'nowrap' }}>
                                                    {club.upcoming_events_count} próximo{club.upcoming_events_count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#3b4a66', margin: '2px 0 8px' }}>
                                                {club.name}{club.faculty ? ` - ${club.faculty}` : ''}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#5a5a5a', lineHeight: 1.5 }}>{club.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Iniciales del club en un recuadro azul
function Sigla({ texto, grande = false }) {
    const palabras = texto.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, '').split(' ').filter(Boolean);
    // Una sola palabra: sus mayusculas (FanPol = FP) o sus dos primeras letras
    const iniciales = (palabras.length > 1
        ? palabras.map((p) => p[0]).join('')
        : (palabras[0]?.match(/[A-ZÁÉÍÓÚÑ]/g)?.length > 1 ? palabras[0].match(/[A-ZÁÉÍÓÚÑ]/g).join('') : palabras[0] ?? '')
    ).slice(0, 2).toUpperCase();
    const lado = grande ? 56 : 42;
    return (
        <div style={{ width: lado, height: lado, flexShrink: 0, borderRadius: 8, background: '#1e40af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: grande ? 18 : 14 }}>
            {iniciales}
        </div>
    );
}
