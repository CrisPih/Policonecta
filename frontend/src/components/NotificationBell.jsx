import { useCallback, useEffect, useRef, useState } from 'react';
import { eventService } from '../services/eventService';

const INTERVALO = 60000;

// Campana de avisos: publicaciones afines, recordatorios, cierres y valoraciones pendientes
export default function NotificationBell({ setCurrentPage }) {
    const [avisos, setAvisos] = useState([]);
    const [sinLeer, setSinLeer] = useState(0);
    const [abierto, setAbierto] = useState(false);
    const contenedor = useRef(null);

    const cargar = useCallback(() => {
        eventService.getNotifications()
            .then((d) => {
                setAvisos(d.notifications ?? []);
                setSinLeer(d.unread ?? 0);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        cargar();
        const id = setInterval(cargar, INTERVALO);
        return () => clearInterval(id);
    }, [cargar]);

    // Cierra el panel al hacer clic fuera
    useEffect(() => {
        if (!abierto) return undefined;
        const fuera = (e) => contenedor.current && !contenedor.current.contains(e.target) && setAbierto(false);
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
    }, [abierto]);

    const alternar = () => {
        const abrir = !abierto;
        setAbierto(abrir);
        if (abrir && sinLeer > 0) {
            eventService.markNotificationsRead().then(() => setSinLeer(0)).catch(() => {});
        }
    };

    const abrirAviso = (aviso) => {
        setAbierto(false);
        if (aviso.kind === 'valorar') setCurrentPage('my-registrations');
        else if (aviso.event_id) setCurrentPage('event-detail', aviso.event_id);
    };

    return (
        <div ref={contenedor} style={{ position: 'relative' }}>
            <button
                onClick={alternar}
                aria-label={sinLeer ? `Avisos, ${sinLeer} sin leer` : 'Avisos'}
                style={{ position: 'relative', background: 'none', border: '1px solid #d4d4d4', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {sinLeer > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#1e40af', color: '#fff', borderRadius: 9, minWidth: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                        {sinLeer > 9 ? '9+' : sinLeer}
                    </span>
                )}
            </button>

            {abierto && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        width: 'min(320px, calc(100vw - 32px))',
                        maxHeight: 380,
                        overflowY: 'auto',
                        background: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: 6,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                        zIndex: 300,
                    }}
                >
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>Avisos</div>
                    {avisos.length === 0 ? (
                        <div style={{ padding: '18px 14px', fontSize: 13, color: '#9a9a9a' }}>Sin avisos</div>
                    ) : (
                        avisos.map((a) => (
                            <button
                                key={a.id}
                                onClick={() => abrirAviso(a)}
                                style={{ display: 'block', width: '100%', textAlign: 'left', background: a.read_at ? '#fff' : '#f3f6fb', border: 'none', borderBottom: '1px solid #f0f0f0', padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>{a.title}</div>
                                <div style={{ fontSize: 12, color: '#3a3a3a', marginTop: 2 }}>{a.body}</div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
