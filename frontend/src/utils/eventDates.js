// Utilidades de fechas y estado de los eventos -- Cristina Pihuave

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Convierte "2026-09-15" en una fecha local, sin desfase de zona horaria
export function parseFecha(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
}

// Fecha de hoy sin horas, para comparar solo por dia
function hoy() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Tipos de publicacion y su nombre visible
export const TIPOS = {
    evento: 'Evento',
    pasantia: 'Pasantía',
    beca: 'Beca',
    investigacion: 'Investigación',
    convocatoria: 'Convocatoria',
};

export function esOportunidad(event) {
    return !!event?.type && event.type !== 'evento';
}

// Estado de una oportunidad segun su fecha limite
function estadoOportunidad(event) {
    const limite = parseFecha(event?.deadline);
    if (!limite) return { clave: 'abierta', texto: 'Abierta', color: '#1e40af' };

    const dias = Math.round((limite - hoy()) / 86400000);

    if (dias < 0) return { clave: 'finalizado', texto: 'Cerrada', color: '#9a9a9a' };
    if (dias === 0) return { clave: 'proximo', texto: 'Cierra hoy', color: '#1e3a8a' };
    if (dias === 1) return { clave: 'proximo', texto: 'Cierra mañana', color: '#1e3a8a' };
    if (dias <= 7) return { clave: 'proximo', texto: `Cierra en ${dias} días`, color: '#1e3a8a' };

    return { clave: 'abierta', texto: 'Abierta', color: '#1e40af' };
}

// Devuelve el estado del evento segun su fecha
export function estadoEvento(event) {
    if (esOportunidad(event)) return estadoOportunidad(event);

    const inicio = parseFecha(event?.start_date || event?.date);
    const fin = parseFecha(event?.end_date) || inicio;

    if (!inicio) return { clave: 'sin_fecha', texto: 'Sin fecha', color: '#9a9a9a' };

    const ahora = hoy();

    if (fin < ahora) {
        return { clave: 'finalizado', texto: 'Finalizado', color: '#9a9a9a' };
    }

    if (inicio <= ahora && ahora <= fin) {
        return { clave: 'en_curso', texto: 'En curso', color: '#1e40af' };
    }

    // Se destacan los eventos de los proximos siete dias
    const diasFaltantes = Math.round((inicio - ahora) / 86400000);

    if (diasFaltantes === 1) {
        return { clave: 'proximo', texto: 'Mañana', color: '#1e3a8a' };
    }

    if (diasFaltantes <= 7) {
        return { clave: 'proximo', texto: `En ${diasFaltantes} días`, color: '#1e3a8a' };
    }

    return { clave: 'proximo', texto: 'Próximo', color: '#5a5a5a' };
}

export function esPasado(event) {
    return estadoEvento(event).clave === 'finalizado';
}

// Fecha larga: "15 de septiembre de 2026"
export function fechaLarga(dateStr) {
    const d = parseFecha(dateStr);
    if (!d) return '';

    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

// Rango de fechas del evento en texto
export function rangoFechas(startDate, endDate) {
    const inicio = fechaLarga(startDate);
    const fin = fechaLarga(endDate);

    if (!inicio) return 'Fecha por confirmar';
    if (!fin || startDate === endDate) return inicio;

    return `${inicio} al ${fin}`;
}

// Genera el contenido de un archivo .ics para agregar el evento al calendario
export function generarICS(event) {
    const soloFecha = (d) => d.replace(/-/g, '');
    const soloHora = (t) => (t ? t.slice(0, 5).replace(':', '') + '00' : '090000');

    const inicio = (event.start_date || event.date || '').split('T')[0];
    const fin = (event.end_date || inicio).split('T')[0];

    if (!inicio) return null;

    const dtStart = `${soloFecha(inicio)}T${soloHora(event.start_time)}`;
    const dtEnd = `${soloFecha(fin)}T${soloHora(event.end_time || event.start_time)}`;

    // Las comas y los saltos de linea deben escaparse en el formato iCalendar
    const limpiar = (texto) => String(texto || '')
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PoliConecta//ES',
        'BEGIN:VEVENT',
        `UID:evento-${event.id}@policonecta`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${limpiar(event.title)}`,
        `DESCRIPTION:${limpiar(event.description)}`,
        `LOCATION:${limpiar(event.location)}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
}

// Descarga el evento como archivo .ics
export function descargarICS(event) {
    const contenido = generarICS(event);
    if (!contenido) return;

    const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${(event.title || 'evento').replace(/[^\w\s-]/g, '').trim()}.ics`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
}
