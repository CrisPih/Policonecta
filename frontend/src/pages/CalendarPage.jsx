import { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { parseFecha, estadoEvento, rangoFechas } from '../utils/eventDates';

// Calendario mensual de eventos -- Cristina Pihuave
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarPage({ setCurrentPage }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const inicial = new Date();
    const [mes, setMes] = useState(inicial.getMonth());
    const [anio, setAnio] = useState(inicial.getFullYear());
    const [diaActivo, setDiaActivo] = useState(null);

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

    // Devuelve los eventos que ocurren en un dia del mes mostrado
    const eventosDelDia = (dia) => {
        const fecha = new Date(anio, mes, dia);

        return events.filter((e) => {
            const inicio = parseFecha(e.start_date || e.date);
            const fin = parseFecha(e.end_date) || inicio;
            if (!inicio) return false;

            return fecha >= inicio && fecha <= fin;
        });
    };

    const cambiarMes = (delta) => {
        let nuevoMes = mes + delta;
        let nuevoAnio = anio;

        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAnio -= 1;
        } else if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAnio += 1;
        }

        setMes(nuevoMes);
        setAnio(nuevoAnio);
        setDiaActivo(null);
    };

    // Construye la cuadricula del mes empezando en lunes
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const primerDia = new Date(anio, mes, 1).getDay();
    const desplazamiento = primerDia === 0 ? 6 : primerDia - 1;

    const celdas = [];
    for (let i = 0; i < desplazamiento; i++) celdas.push(null);
    for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

    const hoy = new Date();
    const esHoy = (dia) =>
        dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

    const eventosActivos = diaActivo ? eventosDelDia(diaActivo) : [];

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 40px 60px' }}>

                <div style={{ marginBottom: 26 }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                        Calendario
                    </h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>
                        Publicaciones programadas en cada mes.
                    </p>
                </div>

                <div style={cardStyle}>
                    {/* Cabecera con el mes y la navegación */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e5e5' }}>
                        <button onClick={() => cambiarMes(-1)} style={navBtn}>←</button>

                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d' }}>
                            {MESES[mes]} {anio}
                        </div>

                        <button onClick={() => cambiarMes(1)} style={navBtn}>→</button>
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: '#7a7a7a', fontSize: 14 }}>
                            Cargando eventos...
                        </div>
                    ) : (
                        <div style={{ padding: 16 }}>
                            {/* Nombres de los días */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                                {DIAS.map((d) => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9a9a9a', }}>
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Cuadrícula del mes */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                                {celdas.map((dia, i) => {
                                    if (!dia) return <div key={`v-${i}`} />;

                                    const delDia = eventosDelDia(dia);
                                    const activo = diaActivo === dia;

                                    return (
                                        <button
                                            key={dia}
                                            onClick={() => setDiaActivo(activo ? null : dia)}
                                            style={{
                                                minHeight: 72,
                                                background: activo ? '#1e40af' : '#fff',
                                                color: activo ? '#fff' : '#3a3a3a',
                                                border: esHoy(dia) ? '2px solid #1e40af' : '1px solid #e5e5e5',
                                                borderRadius: 4,
                                                padding: '6px 8px',
                                                cursor: delDia.length ? 'pointer' : 'default',
                                                fontFamily: 'inherit',
                                                textAlign: 'left',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4,
                                            }}
                                        >
                                            <span style={{ fontSize: 12, fontWeight: esHoy(dia) ? 700 : 500 }}>
                                                {dia}
                                            </span>

                                            {delDia.slice(0, 2).map((e) => (
                                                <span
                                                    key={e.id}
                                                    style={{
                                                        fontSize: 9,
                                                        background: activo ? '#ffffff22' : '#efefef',
                                                        color: activo ? '#fff' : '#5a5a5a',
                                                        borderRadius: 2,
                                                        padding: '2px 4px',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {e.title}
                                                </span>
                                            ))}

                                            {delDia.length > 2 && (
                                                <span style={{ fontSize: 9, color: activo ? '#ddd' : '#9a9a9a' }}>
                                                    +{delDia.length - 2} más
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Detalle de los eventos del día seleccionado */}
                {diaActivo && (
                    <div style={{ marginTop: 20 }}>
                        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f1f3d' }}>
                            {diaActivo} de {MESES[mes].toLowerCase()} de {anio}
                        </h2>

                        {eventosActivos.length === 0 ? (
                            <div style={{ ...cardStyle, padding: '24px 20px', fontSize: 13, color: '#9a9a9a', textAlign: 'center' }}>
                                No hay eventos programados este día.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 10 }}>
                                {eventosActivos.map((e) => {
                                    const estado = estadoEvento(e);

                                    return (
                                        <div key={e.id} style={{ ...cardStyle, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 220 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f1f3d' }}>
                                                        {e.title}
                                                    </h3>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: estado.color, }}>
                                                        {estado.texto}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#7a7a7a' }}>
                                                    {rangoFechas(e.start_date || e.date, e.end_date)}
                                                    {e.start_time ? ` - ${e.start_time.slice(0, 5)}` : ''}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#9a9a9a' }}>{e.location}</div>
                                            </div>

                                            <button
                                                onClick={() => setCurrentPage('event-detail', e.id)}
                                                style={secondaryBtn}
                                            >
                                                Ver detalles
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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

const navBtn = {
    background: 'none',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '6px 14px',
    fontSize: 14,
    color: '#5a5a5a',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
