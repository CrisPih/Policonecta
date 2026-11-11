import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import { eventService } from '../services/eventService';
import useEsMovil from '../hooks/useEsMovil';

const VISIBLES = 4;

// Publicaciones recomendadas segun el perfil del usuario
export default function RecommendedSection({ user, onSelect, onEditProfile }) {
    const [items, setItems] = useState([]);
    const [cargado, setCargado] = useState(false);
    const [verTodas, setVerTodas] = useState(false);
    const esMovil = useEsMovil();

    useEffect(() => {
        if (!user) return;
        eventService
            .getRecommendations(9)
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setCargado(true));
    }, [user]);

    if (!user || !cargado) return null;

    const sinPreferencias = !user.faculty && !(user.interests || []).length;
    const mostradas = verTodas ? items : items.slice(0, VISIBLES);
    const hayMas = items.length > VISIBLES;

    return (
        <section className="pc-gutter" style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 40px 36px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f1f3d' }}>Recomendados para usted</h2>
                <button
                    onClick={onEditProfile}
                    style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                >
                    Editar intereses
                </button>
            </div>

            {items.length === 0 ? (
                <div style={{ background: '#fff', border: '1px dashed #c3cfe4', borderRadius: 4, padding: '24px 20px', fontSize: 13, color: '#5a5a5a' }}>
                    {sinPreferencias ? 'Registre su facultad e intereses en su perfil' : 'Sin recomendaciones por ahora'}
                </div>
            ) : (
                <>
                    {/* En el telefono las tarjetas se deslizan de lado */}
                    <div
                        className="pc-deslizable"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}
                    >
                        {(esMovil ? items : mostradas).map((ev) => (
                            <EventCard key={ev.id} event={ev} reasons={ev.reasons} onSelect={onSelect} compacto />
                        ))}
                    </div>

                    {esMovil && items.length > 1 && (
                        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#7a7a7a', textAlign: 'center' }}>
                            Deslice horizontalmente para ver más recomendaciones
                        </p>
                    )}

                    {!esMovil && hayMas && (
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <button
                                onClick={() => setVerTodas((v) => !v)}
                                style={{ background: '#fff', color: '#1e40af', border: '1px solid #1e40af', borderRadius: 4, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                {verTodas ? 'Ver menos' : `Ver más (${items.length - VISIBLES})`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
