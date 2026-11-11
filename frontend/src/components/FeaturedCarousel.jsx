import { useEffect, useState } from 'react';
import { eventService } from '../services/eventService';
import { TIPOS, fechaLarga } from '../utils/eventDates';

const INTERVALO = 6000;

// Carrusel de publicaciones destacadas (patrocinadas) en el inicio
export default function FeaturedCarousel({ onSelect }) {
    const [items, setItems] = useState([]);
    const [actual, setActual] = useState(0);
    const [pausado, setPausado] = useState(false);

    useEffect(() => {
        eventService.getFeatured().then(setItems).catch(() => setItems([]));
    }, []);

    useEffect(() => {
        if (pausado || items.length < 2) return undefined;
        const id = setInterval(() => setActual((i) => (i + 1) % items.length), INTERVALO);
        return () => clearInterval(id);
    }, [pausado, items.length]);

    if (items.length === 0) return null;

    const item = items[actual % items.length];
    const mover = (paso) => setActual((i) => (i + paso + items.length) % items.length);
    const fecha = item.type && item.type !== 'evento' && item.deadline
        ? `Postulación hasta el ${fechaLarga(item.deadline)}`
        : fechaLarga(item.start_date);

    return (
        <section
            aria-roledescription="carrusel"
            aria-label="Publicaciones destacadas"
            onMouseEnter={() => setPausado(true)}
            onMouseLeave={() => setPausado(false)}
            style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 40px 40px', boxSizing: 'border-box' }}
            className="pc-gutter"
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f1f3d' }}>Destacados</h2>
                <span style={{ fontSize: 11, color: '#7a7a7a' }}>
                    {actual + 1} de {items.length}
                </span>
            </div>

            <div
                className="pc-carrusel"
                style={{
                    position: 'relative',
                    borderRadius: 8,
                    overflow: 'hidden',
                    minHeight: 340,
                    background: '#0b2a5b',
                    display: 'flex',
                    alignItems: 'flex-end',
                }}
            >
                {item.image && (
                    <img
                        src={item.image}
                        alt=""
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, rgba(11,42,91,0.95) 0%, rgba(11,42,91,0.75) 45%, rgba(11,42,91,0.15) 100%)',
                    }}
                />

                <div className="pc-carrusel-texto" style={{ position: 'relative', padding: '32px 64px', maxWidth: 620, color: '#fff', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        <Chip>{TIPOS[item.type] || 'Evento'}</Chip>
                        {item.faculty && <Chip>{item.faculty}</Chip>}
                        {item.sponsor && <Chip>Patrocinado por {item.sponsor}</Chip>}
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: '#fff' }}>
                        {item.title}
                    </h3>
                    {fecha && <p style={{ margin: '0 0 6px', fontSize: 13, color: '#c7d6f2' }}>{fecha}</p>}
                    {item.description && (
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#dbe4f3', lineHeight: 1.5 }}>
                            {item.description.slice(0, 140)}
                            {item.description.length > 140 ? '...' : ''}
                        </p>
                    )}
                    <button
                        onClick={() => onSelect(item)}
                        style={{
                            background: '#fff',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: 4,
                            padding: '9px 18px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        Ver detalles
                    </button>
                </div>

                {items.length > 1 && (
                    <>
                        <Flecha lado="left" onClick={() => mover(-1)} etiqueta="Anterior" />
                        <Flecha lado="right" onClick={() => mover(1)} etiqueta="Siguiente" />
                    </>
                )}
            </div>

            {items.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                    {items.map((it, i) => (
                        <button
                            key={it.id}
                            aria-label={`Ir a la publicación ${i + 1}`}
                            onClick={() => setActual(i)}
                            style={{
                                width: i === actual ? 22 : 8,
                                height: 8,
                                borderRadius: 4,
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                background: i === actual ? '#1e40af' : '#c3cfe4',
                                transition: 'width 0.2s',
                            }}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function Chip({ children }) {
    return (
        <span
            style={{
                background: 'rgba(255,255,255,0.16)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 3,
            }}
        >
            {children}
        </span>
    );
}

function Flecha({ lado, onClick, etiqueta }) {
    return (
        <button
            onClick={onClick}
            aria-label={etiqueta}
            style={{
                position: 'absolute',
                top: '50%',
                [lado]: 12,
                transform: 'translateY(-50%)',
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                color: '#1e40af',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1,
            }}
        >
            {lado === 'left' ? '‹' : '›'}
        </button>
    );
}
