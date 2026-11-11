import React, { useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import { estadoEvento, esOportunidad, fechaLarga, TIPOS } from '../utils/eventDates';

// compacto: version reducida para las recomendaciones (sin descripcion ni cupos)
export default function EventCard({ event, onSelect, reasons = [], compacto = false }) {
    const [imgError, setImgError] = useState(false);
    const altoImagen = compacto ? 110 : 160;
    const estado = estadoEvento(event);

    // Mapeo de campos de la base de datos
    const oportunidad = esOportunidad(event);
    const sinLimite = event?.max_participants == null;
    const maxSeats = event?.max_participants || 1;
    const availableSeats = event?.available_spots ?? maxSeats;
    const takenSeats = maxSeats - availableSeats;
    const pct = Math.round((takenSeats / maxSeats) * 100);

    // Evaluación de campos de fecha
    const startDate = event?.start_date || event?.date || event?.event_date || event?.fecha;
    const endDate = event?.end_date || event?.fecha_fin;

    // Formateador mejorado para soportar 1 día o rangos de fechas
    const formatDateTime = (startStr, endStr, startTime, endTime) => {
        if (!startStr) return 'Fecha por confirmar';

        const parseDate = (dStr) => {
            if (!dStr) return null;
            const pureDate = dStr.split('T')[0];
            const [year, month, day] = pureDate.split('-');
            if (!year || !month || !day) return null;
            return { year, monthIndex: parseInt(month, 10) - 1, day: parseInt(day, 10) };
        };

        const start = parseDate(startStr);
        const end = parseDate(endStr);

        if (!start) return startStr;

        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        let formattedDate = '';

        // Si existe fecha de fin y es diferente a la de inicio
        if (end && (start.day !== end.day || start.monthIndex !== end.monthIndex || start.year !== end.year)) {
            if (start.monthIndex === end.monthIndex && start.year === end.year) {
                // Mismo mes y año: "20 - 21 Nov 2026"
                formattedDate = `${start.day} - ${end.day} ${months[start.monthIndex]} ${start.year}`;
            } else if (start.year === end.year) {
                // Distinto mes, mismo año: "28 Oct - 2 Nov 2026"
                formattedDate = `${start.day} ${months[start.monthIndex]} - ${end.day} ${months[end.monthIndex]} ${start.year}`;
            } else {
                // Distinto año: "28 Dec 2026 - 2 Jan 2027"
                formattedDate = `${start.day} ${months[start.monthIndex]} ${start.year} - ${end.day} ${months[end.monthIndex]} ${end.year}`;
            }
        } else {
            // Un solo día: "25 Aug 2026"
            formattedDate = `${start.day} ${months[start.monthIndex]} ${start.year}`;
        }

        // Limpieza de horas
        const cleanTime = (time) => (time && typeof time === 'string' ? time.slice(0, 5) : '');
        const sTime = cleanTime(startTime || event?.hora_inicio || event?.hora);
        const eTime = cleanTime(endTime || event?.hora_fin);

        if (!sTime && !eTime) return formattedDate;

        const timeRange = eTime ? `${sTime} a ${eTime}` : sTime;
        return `${formattedDate} - ${timeRange}`;
    };

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #d4d4d4',
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
            {/* RENDERIZADO DE IMAGEN O PLACEHOLDER */}
            <div style={{ position: 'relative' }}>
                {event?.image && !imgError ? (
                    <div style={{ width: '100%', height: altoImagen, overflow: 'hidden', backgroundColor: '#f3f6fb' }}>
                        <img
                            src={event.image}
                            alt={event.title || 'Evento'}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: estado.clave === 'finalizado' ? 'grayscale(1) opacity(0.65)' : 'none',
                            }}
                            onError={() => setImgError(true)}
                        />
                    </div>
                ) : (
                    <ImagePlaceholder height={altoImagen} label={compacto ? '' : 'Imagen del evento'} style={{ borderRadius: 0 }} />
                )}

                {/* Estado del evento segun su fecha */}
                <span
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: '#fff',
                        color: estado.color,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '4px 9px',
                        borderRadius: 3,
                        border: `1px solid ${estado.color}33`,
                    }}
                >
                    {estado.texto}
                </span>
            </div>

            <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {/* Tags de Facultad y Categoría */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {oportunidad && <Tag destacado>{TIPOS[event.type]}</Tag>}
                    {event?.faculty && <Tag>{event.faculty}</Tag>}
                    {event?.category && <Tag>{event.category}</Tag>}
                    {Number(event?.price) > 0 && <Tag destacado>${Number(event.price).toFixed(2)}</Tag>}
                </div>

                {/* Título */}
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f1f3d', lineHeight: 1.3 }}>
                    {event?.title || 'Sin título'}
                </h3>

                {/* Fecha y Hora Formateadas */}
                <div style={{ fontSize: 12, color: '#7a7a7a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalIcon /> {formatDateTime(startDate, endDate, event?.start_time, event?.end_time)}
                </div>

                {oportunidad && event?.deadline && (
                    <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>
                        Postulación hasta el {fechaLarga(event.deadline)}
                    </div>
                )}

                {/* Ubicación */}
                {event?.location && (
                    <div style={{ fontSize: 12, color: '#7a7a7a', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PinIcon /> {event.location}
                    </div>
                )}

                {/* Descripción corta */}
                {!compacto && (
                <p style={{ margin: 0, fontSize: 12, color: '#5a5a5a', lineHeight: 1.55, flex: 1 }}>
                    {event?.description?.slice(0, 110)}
                    {event?.description?.length > 110 ? '...' : ''}
                </p>
                )}

                {reasons.length > 0 && (
                    <div style={{ fontSize: 11, color: '#1e40af', flex: compacto ? 1 : 'none' }}>
                        {reasons[0]}
                    </div>
                )}

                {/* Barra de cupos */}
                {!sinLimite && !compacto && (
                <div style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: '#9a9a9a' }}>
                        <span>{availableSeats} cupos disponibles</span>
                        <span>{pct}% lleno</span>
                    </div>
                    <div style={{ height: 4, background: '#efefef', borderRadius: 2 }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: pct > 80 ? '#1e3a8a' : '#93b0e0',
                                borderRadius: 2,
                            }}
                        />
                    </div>
                </div>
                )}

                {/* Botón de ver detalles */}
                <button
                    onClick={() => onSelect && onSelect(event)}
                    style={compacto ? {
                        marginTop: 4,
                        background: '#fff',
                        color: '#1e40af',
                        border: '1px solid #c3cfe4',
                        borderRadius: 4,
                        padding: '7px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        width: '100%',
                    } : {
                        marginTop: 8,
                        background: '#1e40af',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '9px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        width: '100%',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!compacto) e.currentTarget.style.background = '#1e3a8a'; }}
                    onMouseLeave={(e) => { if (!compacto) e.currentTarget.style.background = '#1e40af'; }}
                >
                    Ver detalles
                </button>
            </div>
        </div>
    );
}

function Tag({ children, destacado = false }) {
    return (
        <span
            style={{
                background: destacado ? '#1e40af' : '#eef3fb',
                color: destacado ? '#fff' : '#3b4a66',
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

function CalIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#9a9a9a" strokeWidth="1.3" />
            <path d="M5 2v2M11 2v2M2 7h12" stroke="#9a9a9a" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    );
}

function PinIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
                d="M8 1.5C5.79 1.5 4 3.29 4 5.5c0 3.25 4 9 4 9s4-5.75 4-9c0-2.21-1.79-4-4-4z"
                stroke="#9a9a9a"
                strokeWidth="1.3"
            />
            <circle cx="8" cy="5.5" r="1.5" stroke="#9a9a9a" strokeWidth="1.3" />
        </svg>
    );
}