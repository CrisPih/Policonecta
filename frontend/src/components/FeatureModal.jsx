import { useEffect, useState } from 'react';
import PaymentModal from './PaymentModal';
import { eventService } from '../services/eventService';

// Compra de un plan para mostrar la publicacion en el carrusel de destacados
export default function FeatureModal({ event, onClose, onDone }) {
    const [planes, setPlanes] = useState([]);
    const [dias, setDias] = useState(null);
    const [patrocinador, setPatrocinador] = useState(event.sponsor ?? '');

    useEffect(() => {
        eventService.getFeaturedPlans()
            .then((lista) => {
                setPlanes(lista);
                setDias(lista[0]?.days ?? null);
            })
            .catch(() => setPlanes([]));
    }, []);

    const plan = planes.find((p) => p.days === dias);

    return (
        <PaymentModal
            title="Destacar publicación"
            concept={plan ? `Destacado por ${plan.days} días` : 'Destacado'}
            amount={plan?.price ?? 0}
            disabled={!plan}
            onClose={onClose}
            onDone={onDone}
            onPay={(tarjeta) => eventService.featureEvent(event.id, {
                plan_days: dias,
                sponsor: patrocinador.trim() || null,
                ...tarjeta,
            })}
        >
            <p style={{ margin: 0, fontSize: 13, color: '#3b4a66' }}>
                {event.title}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {planes.map((p) => {
                    const activo = p.days === dias;
                    return (
                        <button
                            type="button"
                            key={p.days}
                            onClick={() => setDias(p.days)}
                            aria-pressed={activo}
                            aria-label={`${p.days} días, $${Number(p.price).toFixed(2)}`}
                            style={{
                                border: activo ? '2px solid #1e40af' : '1px solid #d4d4d4',
                                background: activo ? '#eef3fb' : '#fff',
                                borderRadius: 6,
                                padding: '10px 6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                color: '#0f1f3d',
                            }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{p.days} días</div>
                            <div style={{ fontSize: 12, color: '#3b4a66' }}>${Number(p.price).toFixed(2)}</div>
                        </button>
                    );
                })}
            </div>

            <label style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3a3a3a', marginBottom: 5 }}>Patrocinador</span>
                <input
                    value={patrocinador}
                    onChange={(e) => setPatrocinador(e.target.value)}
                    placeholder="Ej: Empresa auspiciante"
                    maxLength={150}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d4d4d4', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
            </label>
        </PaymentModal>
    );
}
