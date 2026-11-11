import { useEffect, useState } from 'react';
import { eventService } from '../services/eventService';
import { TIPOS } from '../utils/eventDates';

const monto = (n) => `$${Number(n || 0).toFixed(2)}`;
const porcentaje = (n) => (n === null || n === undefined ? '-' : `${n}%`);
const nota = (n) => (n === null || n === undefined ? '-' : `${n} / 5`);

// Descarga un CSV que Excel abre con tildes correctas
function descargarCSV(nombre, filas) {
    const texto = filas
        .map((fila) => fila.map((celda) => `"${String(celda ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');
    const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

// Tablero de metricas del organizador con reportes exportables
export default function OrganizerStats() {
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        eventService.getOrganizerStats()
            .then(setDatos)
            .catch((err) => setError(err.message || 'No se pudieron cargar las estadísticas.'));
    }, []);

    if (error) return <div style={{ ...caja, color: '#0f1f3d', background: '#fff' }}>{error}</div>;
    if (!datos) return <div style={{ padding: '40px 0', textAlign: 'center', color: '#7a7a7a', fontSize: 14 }}>Cargando estadísticas...</div>;

    const { totals, events, by_faculty: porFacultad, by_career: porCarrera, comments } = datos;

    const exportar = () => {
        const filas = [
            ['Publicación', 'Tipo', 'Fecha', 'Inscritos', 'Asistentes', 'Asistencia (%)', 'Valoración', 'Valoraciones', 'Ingresos por entradas (USD)'],
            ...events.map((e) => [
                e.title, TIPOS[e.type] || e.type, (e.start_date || '').slice(0, 10), e.registered, e.attended,
                e.attendance_rate ?? '', e.rating_average ?? '', e.rating_count, e.ticket_income,
            ]),
            [],
            ['Facultad', 'Inscritos', 'Asistentes'],
            ...porFacultad.map((f) => [f.name, f.registered, f.attended]),
            [],
            ['Carrera', 'Inscritos', 'Asistentes'],
            ...porCarrera.map((c) => [c.name, c.registered, c.attended]),
        ];
        descargarCSV(`reporte-policonecta-${new Date().toISOString().slice(0, 10)}.csv`, filas);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e40af' }}>Resumen de sus publicaciones</h2>
                <button onClick={exportar} style={boton}>Exportar CSV</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <Indicador titulo="Publicaciones" valor={totals.events} />
                <Indicador titulo="Inscritos" valor={totals.registered} />
                <Indicador titulo="Asistentes" valor={totals.attended} />
                <Indicador titulo="Asistencia" valor={porcentaje(totals.attendance_rate)} />
                <Indicador titulo="Valoración media" valor={nota(totals.rating_average)} />
                <Indicador titulo="Ingresos por entradas" valor={monto(totals.ticket_income)} />
                <Indicador titulo="Inversión en destacados" valor={monto(totals.featured_spent)} />
            </div>

            <div style={caja}>
                <h3 style={subtitulo}>Por publicación</h3>
                {events.length === 0 ? (
                    <p style={vacio}>Sin publicaciones</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tabla}>
                            <thead>
                                <tr>
                                    {['Publicación', 'Inscritos', 'Asistentes', 'Asistencia', 'Valoración', 'Ingresos'].map((t) => (
                                        <th key={t} style={th}>{t}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((e) => (
                                    <tr key={e.id}>
                                        <td style={td}>
                                            <div style={{ fontWeight: 600, color: '#0f1f3d' }}>{e.title}</div>
                                            <div style={{ fontSize: 11, color: '#7a7a7a' }}>{TIPOS[e.type] || e.type}</div>
                                        </td>
                                        <td style={td}>{e.registered}</td>
                                        <td style={td}>{e.attended}</td>
                                        <td style={td}><Barra valor={e.attendance_rate} /></td>
                                        <td style={td}>{e.rating_count ? `${nota(e.rating_average)} (${e.rating_count})` : '-'}</td>
                                        <td style={td}>{e.ticket_income ? monto(e.ticket_income) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <Segmento titulo="Por facultad" filas={porFacultad} />
                <Segmento titulo="Por carrera" filas={porCarrera} />
            </div>

            <div style={caja}>
                <h3 style={subtitulo}>Comentarios recientes</h3>
                {comments.length === 0 ? (
                    <p style={vacio}>Sin comentarios</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {comments.map((c) => (
                            <div key={c.id} style={{ borderBottom: '1px solid #eef1f6', paddingBottom: 10 }}>
                                <div style={{ fontSize: 12, color: '#7a7a7a' }}>
                                    {c.event?.title} - {c.user?.name} - {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                                </div>
                                <div style={{ fontSize: 13, color: '#0f1f3d', marginTop: 3 }}>{c.comment}</div>
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
        <div style={{ ...caja, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#7a7a7a', }}>{titulo}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', marginTop: 4 }}>{valor}</div>
        </div>
    );
}

function Barra({ valor }) {
    if (valor === null || valor === undefined) return '-';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 70, height: 6, background: '#e3e9f3', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${valor}%`, height: '100%', background: '#1e40af' }} />
            </div>
            <span>{valor}%</span>
        </div>
    );
}

function Segmento({ titulo, filas }) {
    const maximo = Math.max(1, ...filas.map((f) => f.registered));
    return (
        <div style={caja}>
            <h3 style={subtitulo}>{titulo}</h3>
            {filas.length === 0 ? (
                <p style={vacio}>Sin inscritos</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filas.map((f) => (
                        <div key={f.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#3b4a66', marginBottom: 4 }}>
                                <span>{f.name}</span>
                                <span>{f.attended} de {f.registered}</span>
                            </div>
                            <div style={{ height: 8, background: '#e3e9f3', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                                <div style={{ position: 'absolute', inset: 0, width: `${(f.registered * 100) / maximo}%`, background: '#b9c9ea' }} />
                                <div style={{ position: 'absolute', inset: 0, width: `${(f.attended * 100) / maximo}%`, background: '#1e40af' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const caja = { background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, padding: '16px 20px' };
const subtitulo = { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#0f1f3d' };
const vacio = { margin: 0, fontSize: 13, color: '#9a9a9a' };
const tabla = { width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 560 };
const th = { textAlign: 'left', padding: '6px 8px', color: '#9a9a9a', fontWeight: 600, fontSize: 10, borderBottom: '1px solid #e5e5e5' };
const td = { padding: '8px', color: '#3a3a3a', borderBottom: '1px solid #efefef', verticalAlign: 'top' };
const boton = { background: '#fff', color: '#1e40af', border: '1px solid #1e40af', borderRadius: 4, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
