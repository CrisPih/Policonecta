import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';

const ESPERA_REPETIDO = 3000;

// Sin evento elegido se muestra la lista de eventos publicados del organizador
export default function AttendancePage({ eventId, setCurrentPage }) {
    const [elegido, setElegido] = useState(eventId ?? null);

    if (!elegido) return <SelectorEvento onSelect={setElegido} />;
    return <Lector key={elegido} eventId={elegido} setCurrentPage={setCurrentPage} volver={eventId ? null : () => setElegido(null)} />;
}

function SelectorEvento({ onSelect }) {
    const [eventos, setEventos] = useState(null);

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('user') || 'null');
        const hoy = new Date().toISOString().slice(0, 10);
        eventService.getEvents({ status: 'published', user_id: usuario?.id, kind: 'eventos' })
            .then((lista) => setEventos(
                lista
                    .filter((e) => String(e.user_id) === String(usuario?.id))
                    .filter((e) => (e.end_date || e.start_date || '').slice(0, 10) >= hoy)
            ))
            .catch(() => setEventos([]));
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div className="pc-gutter" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 40px 60px' }}>
                <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>Registro de asistencia</h1>
                {eventos === null ? (
                    <p style={{ fontSize: 13, color: '#7a7a7a' }}>Cargando eventos...</p>
                ) : eventos.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#7a7a7a' }}>Sin eventos próximos</p>
                ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {eventos.map((e) => (
                            <button
                                key={e.id}
                                onClick={() => onSelect(e.id)}
                                style={{ textAlign: 'left', background: '#fff', border: '1px solid #d4d4d4', borderRadius: 6, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>{e.title}</div>
                                <div style={{ fontSize: 12, color: '#7a7a7a', marginTop: 3 }}>
                                    {(e.start_date || '').slice(0, 10).split('-').reverse().join('/')} {e.start_time ? e.start_time.slice(0, 5) : ''} - {e.location}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Registro de asistencia leyendo el codigo QR de la credencial del participante
function Lector({ eventId, setCurrentPage, volver }) {
    const [evento, setEvento] = useState(null);
    const [inscritos, setInscritos] = useState(0);
    const [asistentes, setAsistentes] = useState(0);
    const [camaraActiva, setCamaraActiva] = useState(false);
    const [errorCamara, setErrorCamara] = useState('');
    const [codigo, setCodigo] = useState('');
    const [resultado, setResultado] = useState(null);
    const [historial, setHistorial] = useState([]);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const ultimoRef = useRef({ texto: '', momento: 0 });
    const ocupadoRef = useRef(false);

    useEffect(() => {
        eventService.getEventById(eventId).then((d) => setEvento(d.event)).catch(() => setEvento(null));
        registrationService.getByEvent(eventId)
            .then((d) => {
                const lista = d?.registrations ?? [];
                setInscritos(lista.length);
                setAsistentes(lista.filter((r) => r.attended_at).length);
            })
            .catch(() => {});
    }, [eventId]);

    const registrar = useCallback(async (texto) => {
        if (!texto || ocupadoRef.current) return;
        ocupadoRef.current = true;
        try {
            const data = await eventService.registerAttendance(eventId, texto);
            setResultado({ tipo: 'ok', texto: data.message });
            setAsistentes(data.attended ?? ((n) => n + 1));
            setHistorial((h) => [{ nombre: data.registration?.name, hora: new Date().toLocaleTimeString('es-EC') }, ...h].slice(0, 20));
        } catch (err) {
            setResultado({ tipo: 'error', texto: err.message || 'No se pudo registrar la asistencia.' });
        } finally {
            ocupadoRef.current = false;
        }
    }, [eventId]);

    const detenerCamara = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCamaraActiva(false);
    };

    const iniciarCamara = async () => {
        setErrorCamara('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setCamaraActiva(true);
        } catch {
            setErrorCamara('No se pudo acceder a la cámara. Ingrese el código manualmente.');
        }
    };

    // Conecta el video y analiza cuadros mientras la camara esta activa
    useEffect(() => {
        if (!camaraActiva || !videoRef.current) return undefined;
        const video = videoRef.current;
        video.srcObject = streamRef.current;
        video.play().catch(() => {});

        const intervalo = setInterval(() => {
            if (video.readyState < 2 || !canvasRef.current) return;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const leido = jsQR(imagen.data, imagen.width, imagen.height);
            if (!leido?.data) return;

            const ahora = Date.now();
            const ultimo = ultimoRef.current;
            if (leido.data === ultimo.texto && ahora - ultimo.momento < ESPERA_REPETIDO) return;
            ultimoRef.current = { texto: leido.data, momento: ahora };
            registrar(leido.data);
        }, 300);

        return () => clearInterval(intervalo);
    }, [camaraActiva, registrar]);

    useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

    const enviarManual = (e) => {
        e.preventDefault();
        registrar(codigo.trim());
        setCodigo('');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div className="pc-gutter" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 40px 60px' }}>
                <button
                    onClick={() => { detenerCamara(); if (volver) volver(); else setCurrentPage('organizer-dashboard'); }}
                    style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: 'inherit' }}
                >
                    {volver ? 'Elegir otro evento' : 'Volver al panel'}
                </button>

                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>Registro de asistencia</h1>
                <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#3b4a66' }}>{evento?.title ?? 'Cargando...'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <Indicador titulo="Inscritos" valor={inscritos} />
                    <Indicador titulo="Asistentes" valor={asistentes} />
                </div>

                <div style={{ background: '#fff', border: '1px solid #d4d4d4', borderRadius: 6, padding: 20 }}>
                    {camaraActiva ? (
                        <>
                            <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#000' }}>
                                <video ref={videoRef} playsInline muted style={{ width: '100%', display: 'block' }} />
                                <div style={{ position: 'absolute', inset: '15%', border: '3px solid rgba(255,255,255,0.85)', borderRadius: 10 }} />
                            </div>
                            <button onClick={detenerCamara} style={{ ...botonSecundario, marginTop: 12 }}>Detener cámara</button>
                        </>
                    ) : (
                        <button onClick={iniciarCamara} style={botonPrincipal}>Escanear con la cámara</button>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {errorCamara && <p style={{ margin: '12px 0 0', fontSize: 12, color: '#3b4a66' }}>{errorCamara}</p>}

                    <form onSubmit={enviarManual} style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                        <input
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            placeholder="Código de la credencial"
                            style={{ flex: 1, minWidth: 180, padding: '9px 12px', border: '1px solid #d4d4d4', borderRadius: 4, fontSize: 13, fontFamily: 'inherit' }}
                        />
                        <button type="submit" disabled={!codigo.trim()} style={{ ...botonSecundario, opacity: codigo.trim() ? 1 : 0.5 }}>Registrar</button>
                    </form>

                    {resultado && (
                        <div
                            role="status"
                            style={{
                                marginTop: 16,
                                padding: '12px 14px',
                                borderRadius: 4,
                                fontSize: 14,
                                fontWeight: 600,
                                background: resultado.tipo === 'ok' ? '#fff' : '#fff',
                                color: resultado.tipo === 'ok' ? '#0f1f3d' : '#0f1f3d',
                            }}
                        >
                            {resultado.texto}
                        </div>
                    )}
                </div>

                {historial.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d', margin: '0 0 8px' }}>Registrados en esta sesión</h2>
                        {historial.map((h, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e3e9f3', color: '#3a3a3a' }}>
                                <span>{h.nombre}</span>
                                <span style={{ color: '#7a7a7a' }}>{h.hora}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Indicador({ titulo, valor }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#7a7a7a', }}>{titulo}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>{valor}</div>
        </div>
    );
}

const botonPrincipal = {
    width: '100%',
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
};

const botonSecundario = {
    background: '#fff',
    color: '#1e40af',
    border: '1px solid #1e40af',
    borderRadius: 4,
    padding: '9px 16px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
};
