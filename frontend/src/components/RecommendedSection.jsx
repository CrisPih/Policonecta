import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import { eventService } from '../services/eventService';

// Publicaciones recomendadas segun el perfil del usuario
export default function RecommendedSection({ user, onSelect, onEditProfile }) {
    const [items, setItems] = useState([]);
    const [cargado, setCargado] = useState(false);

    useEffect(() => {
        if (!user) return;
        eventService
            .getRecommendations(6)
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setCargado(true));
    }, [user]);

    if (!user || !cargado) return null;

    const sinPreferencias = !user.faculty && !(user.interests || []).length;

    return (
        <section className="pc-gutter" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px 0', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {items.map((ev) => (
                        <EventCard key={ev.id} event={ev} reasons={ev.reasons} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </section>
    );
}
