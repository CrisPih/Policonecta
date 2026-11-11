import { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import FeaturedCarousel from '../components/FeaturedCarousel';
import RecommendedSection from '../components/RecommendedSection';
import { eventService } from '../services/eventService';
import { esPasado, TIPOS } from '../utils/eventDates';
import { FACULTADES, CATEGORIAS } from '../data/catalogos';

// Opciones de los filtros
const FACULTIES = ['Todas', ...FACULTADES];
const CATEGORIES = ['Todas', ...CATEGORIAS];
const TYPES = ['Todos', ...Object.values(TIPOS)];
const tipoPorNombre = Object.fromEntries(Object.entries(TIPOS).map(([k, v]) => [v, k]));

export default function HomePage({ setCurrentPage, user, facultyFilter, tipoInicial = 'Todos', soloOportunidades = false }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para filtros de búsqueda
    const [search, setSearch] = useState('');
    // La facultad puede venir preseleccionada desde la página de Facultades
    const [faculty, setFaculty] = useState(facultyFilter || 'Todas');
    const [category, setCategory] = useState('Todas');
    const [tipo, setTipo] = useState(tipoInicial);
    const [date, setDate] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    // Periodo mostrado: proximos, pasados o todos
    const [periodo, setPeriodo] = useState('proximos');

    // Carga de datos desde la API / Supabase / Backend
    const fetchEvents = async () => {
        try {
        setLoading(true);
        const data = await eventService.getEvents({
            search,
            faculty: faculty !== 'Todas' ? faculty : '',
            category: category !== 'Todas' ? category : '',
            date,
            type: tipo !== 'Todos' ? tipoPorNombre[tipo] : '',
            kind: soloOportunidades ? 'oportunidades' : '',
        });
        setEvents(data);
        setError(null);
        } catch (err) {
        console.error('Error al cargar eventos:', err);
        setError('No se pudieron cargar los eventos.');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
        fetchEvents();
        }, 300); // Debounce para evitar llamadas excesivas en la búsqueda
        return () => clearTimeout(timer);
    }, [search, faculty, category, date, tipo, soloOportunidades]);

    // Filtrado local en caso de que utilices un arreglo local
    const filtered = events.filter((e) => {
        const matchSearch =
        (e.title && e.title.toLowerCase().includes(search.toLowerCase())) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
        const matchFaculty = faculty === 'Todas' || e.faculty === faculty;
        const matchCategory = category === 'Todas' || e.category === category;
        const matchDate = !date || (e.start_date || '').slice(0, 10) <= date;

        // Por defecto se ocultan los eventos que ya terminaron
        const pasado = esPasado(e);
        const matchPeriodo =
            periodo === 'todos' ||
            (periodo === 'proximos' && !pasado) ||
            (periodo === 'pasados' && pasado);

        return matchSearch && matchFaculty && matchCategory && matchDate && matchPeriodo;
    });

    // Ordenamiento de los resultados
    const fechaOrden = (e) => new Date(e.deadline || e.start_date || 0);
    const sortedEvents = [...filtered].sort((a, b) => {
        if (sortBy === 'recent') {
            // Publicados mas recientemente primero
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }

        if (sortBy === 'popular') {
            // Ordena por mayor porcentaje de ocupación o cupos tomados
            const totalA = a.max_participants || 100;
            const takenA = totalA - (a.available_spots ?? totalA);

            const totalB = b.max_participants || 100;
            const takenB = totalB - (b.available_spots ?? totalB);

            return takenB - takenA; // El que tiene más inscritos va primero
        }

        if (sortBy === 'upcoming') {
            // Fechas mas cercanas primero
            return fechaOrden(a) - fechaOrden(b);
        }
        return 0;
    });

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>

        {/* Encabezado y buscador */}
        <div className="pc-gutter" style={{ background: 'linear-gradient(135deg, #0b2a5b 0%, #1e40af 100%)', padding: '48px 40px 40px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                {soloOportunidades ? 'Oportunidades' : 'PoliConecta'}
            </h1>
            <p style={{ margin: '0 auto 20px', fontSize: 14, color: '#c7d6f2', maxWidth: 520 }}>
                {soloOportunidades
                    ? 'Pasantías, becas, proyectos de investigación y convocatorias de la ESPOL.'
                    : 'Eventos, pasantías, becas y convocatorias de la ESPOL en un solo lugar.'}
            </p>

            {/* Search Input */}
            <div style={{ display: 'flex', gap: 0, maxWidth: 600, margin: '0 auto' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    }}
                >
                    <circle cx="9" cy="9" r="6" stroke="#9a9a9a" strokeWidth="1.6" />
                    <path d="M13.5 13.5L17 17" stroke="#9a9a9a" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={soloOportunidades ? 'Buscar pasantías, becas, proyectos...' : 'Buscar eventos, conferencias, talleres...'}
                    style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '1px solid #c3cfe4',
                    borderRight: 'none',
                    borderRadius: '4px 0 0 4px',
                    fontSize: 13,
                    background: '#fff',
                    color: '#0f1f3d',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    }}
                />
                </div>
                <button
                onClick={fetchEvents}
                style={{
                    background: '#fff',
                    color: '#1e40af',
                    border: '1px solid #c3cfe4',
                    borderLeft: 'none',
                    borderRadius: '0 4px 4px 0',
                    padding: '0 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                }}
                >
                Buscar
                </button>
            </div>
            </div>
        </div>

        {!soloOportunidades && (
            <>
                <FeaturedCarousel onSelect={(ev) => setCurrentPage('event-detail', ev.id)} />
                <RecommendedSection
                    user={user}
                    onSelect={(ev) => setCurrentPage('event-detail', ev.id)}
                    onEditProfile={() => setCurrentPage('profile')}
                />
            </>
        )}

        {/* Filtros */}
        <div style={{ background: '#fff', borderBottom: '1px solid #d4d4d4' }}>
            <div
            className="pc-gutter"
            style={{
                maxWidth: 1280,
                margin: '0 auto',
                padding: '14px 40px',
                boxSizing: 'border-box',
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                flexWrap: 'wrap',
            }}
            >
            <span
                style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#7a7a7a',
                marginRight: 4,
                }}
            >
                Filtrar por
            </span>

            {/* Periodo: proximos, pasados o todos */}
            <div style={{ display: 'flex', gap: 4, marginRight: 4 }}>
                <PeriodoBtn active={periodo === 'proximos'} onClick={() => setPeriodo('proximos')}>
                    Próximos
                </PeriodoBtn>
                <PeriodoBtn active={periodo === 'pasados'} onClick={() => setPeriodo('pasados')}>
                    Historial
                </PeriodoBtn>
                <PeriodoBtn active={periodo === 'todos'} onClick={() => setPeriodo('todos')}>
                    Todos
                </PeriodoBtn>
            </div>

            <FilterSelect label="Tipo" value={tipo} onChange={setTipo} options={soloOportunidades ? TYPES.filter((t) => t !== 'Evento') : TYPES} />
            <FilterSelect label="Facultad" value={faculty} onChange={setFaculty} options={FACULTIES} />
            <FilterSelect label="Categoría" value={category} onChange={setCategory} options={CATEGORIES} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: '#5a5a5a', fontWeight: 500 }}>Fecha</label>
                <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                    border: '1px solid #d4d4d4',
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontSize: 12,
                    color: '#3a3a3a',
                    background: '#fff',
                    fontFamily: 'inherit',
                    outline: 'none',
                }}
                />
            </div>

            {(faculty !== 'Todas' || category !== 'Todas' || tipo !== tipoInicial || date || search) && (
                <button
                onClick={() => {
                    setFaculty('Todas');
                    setCategory('Todas');
                    setTipo(tipoInicial);
                    setDate('');
                    setSearch('');
                }}
                style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: '1px solid #d4d4d4',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: 12,
                    color: '#7a7a7a',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                }}
                >
                Limpiar filtros
                </button>
            )}
            </div>
        </div>

        {/* Results Section */}
        <div className="pc-gutter" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 40px 60px' }}>
            <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 24,
                gap: 12,
                flexWrap: 'wrap',
            }}
            >
            <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f1f3d' }}>
                {search || faculty !== 'Todas' || category !== 'Todas' || tipo !== tipoInicial || date
                    ? 'Resultados'
                    : soloOportunidades ? 'Todas las oportunidades' : 'Todas las publicaciones'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7a7a7a' }}>
                    {sortedEvents.length} resultado{sortedEvents.length !== 1 ? 's' : ''}
                </p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
                <SortBtn
                    active={sortBy === 'recent'}
                    onClick={() => setSortBy('recent')}
                >
                    Más recientes
                </SortBtn>

                <SortBtn
                    active={sortBy === 'popular'}
                    onClick={() => setSortBy('popular')}
                >
                    Más populares
                </SortBtn>

                <SortBtn
                    active={sortBy === 'upcoming'}
                    onClick={() => setSortBy('upcoming')}
                >
                    {soloOportunidades ? 'Cierre más cercano' : 'Más cercanos'}
                </SortBtn>
                </div>
            </div>

            {/* Carga y Errores */}
            {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a7a7a', fontSize: 14 }}>
                Cargando eventos...
            </div>
            )}

            {error && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#3b4a66', fontSize: 14 }}>
                {error}
            </div>
            )}

            {/* Grilla de Eventos o Estado Vacío */}
            {!loading && !error && (
            filtered.length === 0 ? (
                <div
                style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    background: '#fff',
                    border: '1px dashed #d4d4d4',
                    borderRadius: 4,
                }}
                >
                <p style={{ fontSize: 14, color: '#7a7a7a', margin: 0 }}>
                    Sin resultados
                </p>
                </div>
            ) : (
                <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20,
                }}
                >
                {sortedEvents.map((event) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        onSelect={(selectedEvent) => setCurrentPage('event-detail', selectedEvent.id)}
                    />
                    ))}
                </div>
            )
            )}
        </div>
        </div>
    );
}

function FilterSelect({ label, value, onChange, options }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#5a5a5a', fontWeight: 500 }}>{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
            border: '1px solid #d4d4d4',
            borderRadius: 4,
            padding: '6px 28px 6px 10px',
            fontSize: 12,
            color: '#3a3a3a',
            background: '#fff',
            fontFamily: 'inherit',
            outline: 'none',
            appearance: 'none',
            backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239a9a9a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            }}
        >
            {options.map((o) => (
            <option key={o} value={o}>
                {o}
            </option>
            ))}
        </select>
        </div>
    );
}

// Selector de periodo del catalogo -- Cristina Pihuave
function PeriodoBtn({ children, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? '#1e40af' : '#fff',
                color: active ? '#fff' : '#5a5a5a',
                border: '1px solid',
                borderColor: active ? '#1e40af' : '#d4d4d4',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
            }}
        >
            {children}
        </button>
    );
}

function SortBtn({ children, active, onClick }) {
    return (
        <button
        onClick={onClick}
        style={{
            background: active ? '#1e40af' : 'none',
            color: active ? '#fff' : '#7a7a7a',
            border: '1px solid',
            borderColor: active ? '#1e40af' : '#d4d4d4',
            borderRadius: 4,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: active ? 600 : 400,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
        }}
        >
        {children}
        </button>
    );
}