import { useState, useRef, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { FACULTADES as FACULTIES_LIST, CATEGORIAS as CATEGORIES_LIST } from '../data/catalogos';
import { TIPOS } from '../utils/eventDates';

const normalizeDate = (value) => typeof value === 'string' ? value.slice(0, 10) : '';
const normalizeTime = (value) => typeof value === 'string' ? value.slice(0, 5) : '';

export default function CreateEventPage({ navigate, mode = 'create', eventId = null }) {
    const isEdit = mode === 'edit';

    const [form, setForm] = useState({
        title: '',
        description: '',
        faculty: FACULTIES_LIST[0],
        category: CATEGORIES_LIST[0],
        type: 'Presencial',
        date: '',
        endDate: '',
        time: '',
        endTime: '',
        location: '',
        capacity: '',
        tipo: 'evento',
        deadline: '',
        externalLink: '',
        price: '',
    });

    const esOportunidad = form.tipo !== 'evento';

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Eventos del mismo publico que coinciden en fecha y hora
    const [conflictos, setConflictos] = useState([]);
    const [cruceRevisado, setCruceRevisado] = useState(false);

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        if (['date', 'endDate', 'time', 'endTime', 'faculty', 'tipo'].includes(k)) {
            setCruceRevisado(false);
            setConflictos([]);
        }
    };

    // Carga de datos para edición
    useEffect(() => {
        if (!isEdit || !eventId) return;

        const cargarEvento = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await eventService.getEventById(eventId);
                const ev = data?.event ?? data?.data?.event ?? data?.data ?? data;

                if (!ev || typeof ev !== 'object') {
                    throw new Error('La respuesta no contiene un evento válido.');
                }

                setForm({
                    id: ev.id ?? eventId,
                    title: ev.title ?? '',
                    description: ev.description ?? '',
                    faculty: ev.faculty ?? FACULTIES_LIST[0],
                    category: ev.category ?? CATEGORIES_LIST[0],
                    type: ev.modality ?? 'Presencial',
                    date: normalizeDate(ev.start_date ?? ev.date),
                    endDate: normalizeDate(ev.end_date ?? ev.fecha_fin),
                    time: normalizeTime(ev.start_time),
                    endTime: normalizeTime(ev.end_time),
                    location: ev.location ?? '',
                    capacity: ev.max_participants != null ? String(ev.max_participants) : '',
                    tipo: ev.type ?? 'evento',
                    deadline: normalizeDate(ev.deadline),
                    externalLink: ev.external_link ?? '',
                    price: ev.price != null && Number(ev.price) > 0 ? String(ev.price) : '',
                });

                setImagePreview(ev.image ?? null);
            } catch (err) {
                console.error('Error al cargar el evento:', err);
                setError('No se pudo cargar la información del evento.');
            } finally {
                setLoading(false);
            }
        };

        cargarEvento();
    }, [isEdit, eventId]);

    const safeNavigate = (page) => {
        if (typeof navigate === 'function') {
            navigate(page);
        } else {
            window.location.href = '/';
        }
    };

    const handleFileChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setError('Seleccione un archivo de imagen válido (PNG o JPG).');
        }
    };

    const handleInputFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFileChange(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileChange(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Función unificada para guardar (Publicar o Borrador)
    const handleSave = async (targetStatus = 'published') => {
        setLoading(true);
        setError(null);

        const isDraft = targetStatus === 'draft';

        // 1. Validaciones requeridas solo si es PUBLICACIÓN
        if (!isDraft) {
            const faltaEvento = !esOportunidad && (!form.time || !form.location || !form.capacity);
            const faltaOportunidad = esOportunidad && !form.deadline;
            if (!form.title || !form.description || !form.date || faltaEvento || faltaOportunidad) {
                setError('Complete los campos obligatorios (*) para publicar.');
                setLoading(false);
                return;
            }
        } else {
            // Mínimo requerimiento para un borrador: que tenga título
            if (!form.title.trim()) {
                setError('Ingrese un título para guardar el borrador.');
                setLoading(false);
                return;
            }
        }

        // 2. Validaciones de fechas si están ingresadas
        if (form.endDate && form.date && form.endDate < form.date) {
            setError('La fecha de finalización no puede ser anterior a la fecha de inicio.');
            setLoading(false);
            return;
        }

        const isSameDay = !form.endDate || form.endDate === form.date;
        if (isSameDay && form.time && form.endTime && form.endTime <= form.time) {
            setError('La hora de finalización debe ser posterior a la hora de inicio.');
            setLoading(false);
            return;
        }

        // Evita años mal escritos, como 82026 en lugar de 2026
        const anio = parseInt((form.date || '').split('-')[0], 10);
        if (anio && (anio < 2000 || anio > 2100)) {
            setError(`El año ${anio} no es válido. Revise la fecha.`);
            setLoading(false);
            return;
        }

        // Aviso de cruce de horarios antes de publicar un evento
        if (!isDraft && !esOportunidad && !cruceRevisado) {
            try {
                const cruces = await eventService.checkConflicts({
                    start_date: form.date,
                    end_date: form.endDate,
                    start_time: form.time,
                    end_time: form.endTime,
                    faculty: form.faculty,
                    exclude_id: isEdit ? form.id : '',
                });
                setCruceRevisado(true);
                if (cruces.length > 0) {
                    setConflictos(cruces);
                    setLoading(false);
                    return;
                }
            } catch {
                // Si la consulta falla se permite publicar
            }
        }

        // 3. Armado del FormData
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description || '');
        formData.append('faculty', form.faculty);
        formData.append('category', form.category);
        formData.append('modality', form.type || 'Presencial');
        formData.append('status', isDraft ? 'draft' : 'published');
        formData.append('type', form.tipo);
        if (form.deadline) formData.append('deadline', form.deadline);
        if (form.externalLink) formData.append('external_link', form.externalLink.trim());
        formData.append('price', !esOportunidad && form.price ? Number(form.price) : '');

        if (form.date) {
            formData.append('date', form.date);
            formData.append('start_date', form.date);
        }
        if (form.endDate) formData.append('end_date', form.endDate);
        if (form.time) formData.append('start_time', form.time);
        if (form.endTime) formData.append('end_time', form.endTime);
        if (form.capacity) formData.append('max_participants', parseInt(form.capacity, 10));
        if (form.location) formData.append('location', form.location.trim());

        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            if (isEdit) {
                formData.append('_method', 'PUT');
                await eventService.updateEvent(form.id, formData);
            } else {
                await eventService.createEvent(formData);
            }

            const msg = isDraft ? 'Borrador guardado correctamente.' : `Publicación ${isEdit ? 'actualizada' : 'creada'} correctamente.`;
            setSuccessMessage(msg);

            setTimeout(() => {
                safeNavigate('organizer-dashboard');
            }, 1500);

        } catch (err) {
            console.error('Error al guardar el evento:', err);
            setError(err.message || 'No se pudo guardar la publicación.');
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = loading || !!successMessage;

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 40px 60px' }}>
                
                {/* Breadcrumb */}
                <div style={{ fontSize: 12, color: '#9a9a9a', marginBottom: 24, display: 'flex', gap: 6 }}>
                    <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => safeNavigate('home')}
                        style={{ background: 'none', border: 'none', color: '#9a9a9a', cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}
                    >
                        Inicio
                    </button>
                    <span>/</span>
                    <span style={{ color: '#4a4a4a' }}>{isEdit ? 'Editar publicación' : 'Crear publicación'}</span>
                </div>

                {/* Encabezado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                            {isEdit ? 'Editar publicación' : 'Nueva publicación'}
                        </h1>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>
                            Eventos, pasantías, becas, proyectos de investigación y convocatorias.
                        </p>
                    </div>
                </div>

                {/* Notificación de Éxito */}
                {successMessage && (
                    <div style={{ background: '#fff', color: '#0f1f3d', border: '1px solid #d4d4d4', padding: '12px 16px', borderRadius: 4, fontSize: 13, marginBottom: 20, fontWeight: 600 }}>
                        {successMessage} Redirigiendo...
                    </div>
                )}

                {conflictos.length > 0 && (
                    <div style={{ background: '#fff', color: '#0f1f3d', border: '1px solid #d4d4d4', padding: '12px 16px', borderRadius: 4, fontSize: 13, marginBottom: 20 }}>
                        <strong>Cruce de horario con eventos de {form.faculty}:</strong>
                        <ul style={{ margin: '8px 0', paddingLeft: 18 }}>
                            {conflictos.map((c) => (
                                <li key={c.id}>
                                    {c.title} - {normalizeDate(c.start_date).split('-').reverse().join('/')} {normalizeTime(c.start_time)}
                                    {c.end_time ? `-${normalizeTime(c.end_time)}` : ''}
                                    {c.location ? `, ${c.location}` : ''}
                                </li>
                            ))}
                        </ul>
                        Cambie la fecha u hora, o pulse "Publicar de todos modos".
                    </div>
                )}

                {/* Notificación de Error */}
                {error && (
                    <div style={{ background: '#fff', color: '#0f1f3d', padding: '12px 16px', borderRadius: 4, fontSize: 13, marginBottom: 20 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSave('published'); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Información General */}
                    <FormSection title="Información general">
                        <Field label="Tipo de publicación" required>
                            <select disabled={isDisabled} value={form.tipo} onChange={set('tipo')} style={inputStyle}>
                                {Object.entries(TIPOS).map(([valor, texto]) => (
                                    <option key={valor} value={valor}>{texto}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Título" required>
                            <input disabled={isDisabled} value={form.title} onChange={set('title')} placeholder="Ej: Conferencia de Innovación Tecnológica 2026" style={inputStyle} />
                        </Field>

                        <Field label="Descripción" required>
                            <textarea
                                disabled={isDisabled}
                                value={form.description}
                                onChange={set('description')}
                                placeholder="Objetivos, agenda, requisitos..."
                                rows={4}
                                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                            />
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                            <Field label="Facultad" required>
                                <select disabled={isDisabled} value={form.faculty} onChange={set('faculty')} style={inputStyle}>
                                    {form.faculty && !FACULTIES_LIST.includes(form.faculty) && (
                                        <option value={form.faculty}>{form.faculty}</option>
                                    )}
                                    {FACULTIES_LIST.map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Categoría" required>
                                <select disabled={isDisabled} value={form.category} onChange={set('category')} style={inputStyle}>
                                    {form.category && !CATEGORIES_LIST.includes(form.category) && (
                                        <option value={form.category}>{form.category}</option>
                                    )}
                                    {CATEGORIES_LIST.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field label="Modalidad">
                            <select disabled={isDisabled} value={form.type} onChange={set('type')} style={inputStyle}>
                                {form.type && !['Presencial', 'Virtual', 'Híbrido'].includes(form.type) && (
                                    <option value={form.type}>{form.type}</option>
                                )}
                                <option value="Presencial">Presencial</option>
                                <option value="Virtual">Virtual</option>
                                <option value="Híbrido">Híbrido</option>
                            </select>
                        </Field>
                    </FormSection>

                    {/* Fecha, Hora y Lugar */}
                    {esOportunidad && (
                        <FormSection title="Postulación">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                <Field label="Fecha límite de postulación" required>
                                    <input disabled={isDisabled} type="date" value={form.deadline} onChange={set('deadline')} style={inputStyle} />
                                </Field>
                                <Field label="Enlace de postulación">
                                    <input disabled={isDisabled} type="url" value={form.externalLink} onChange={set('externalLink')} placeholder="https://" style={inputStyle} />
                                </Field>
                            </div>
                        </FormSection>
                    )}

                    <FormSection title="Fecha, hora y lugar">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                            <Field label="Fecha de inicio" required>
                                <input disabled={isDisabled} type="date" value={form.date} onChange={set('date')} style={inputStyle} />
                            </Field>

                            <Field label="Fecha de fin (Opcional)">
                                <input disabled={isDisabled} type="date" value={form.endDate} onChange={set('endDate')} min={form.date} style={inputStyle} />
                            </Field>

                            <Field label="Hora de inicio" required={!esOportunidad}>
                                <input disabled={isDisabled} type="time" value={form.time} onChange={set('time')} style={inputStyle} />
                            </Field>

                            <Field label="Hora de fin">
                                <input disabled={isDisabled} type="time" value={form.endTime} onChange={set('endTime')} style={inputStyle} />
                            </Field>
                        </div>

                        <Field label="Ubicación" required={!esOportunidad}>
                            <input disabled={isDisabled} value={form.location} onChange={set('location')} placeholder="Ej: Auditorio Principal - Campus ESPOL" style={inputStyle} />
                        </Field>
                    </FormSection>

                    {/* Capacidad y precio */}
                    <FormSection title={esOportunidad ? 'Capacidad' : 'Capacidad y entrada'}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                            <Field label="Capacidad máxima" required={!esOportunidad}>
                                <input disabled={isDisabled} type="number" value={form.capacity} onChange={set('capacity')} placeholder="Ej: 120" min="1" style={inputStyle} />
                            </Field>
                            {!esOportunidad && (
                                <Field label="Precio de la entrada (USD)" hint="Vacío si la entrada es gratuita.">
                                    <input disabled={isDisabled} type="number" value={form.price} onChange={set('price')} placeholder="0.00" min="0" step="0.50" style={inputStyle} />
                                </Field>
                            )}
                        </div>
                    </FormSection>

                    <FormSection title="Imagen">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleInputFileChange}
                            accept="image/png, image/jpeg, image/jpg"
                            style={{ display: 'none' }}
                            disabled={isDisabled}
                        />

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                                border: isDragging ? '2px dashed #1e40af' : '2px dashed #c8c8c8',
                                borderRadius: 4,
                                padding: '24px',
                                textAlign: 'center',
                                background: isDragging ? '#eef3fb' : '#fafafa',
                                opacity: isDisabled ? 0.6 : 1,
                            }}
                        >
                            {imagePreview ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <img src={imagePreview} alt="Vista previa" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 4, objectFit: 'cover' }} />
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: '#4a4a4a', fontWeight: 600 }}>{imageFile?.name || 'Imagen seleccionada'}</span>
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            disabled={isDisabled}
                                            style={{ background: '#fff', color: '#0f1f3d', border: '1px solid #d4d4d4', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                        >
                                            Quitar imagen
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ width: 60, height: 60, background: '#dbe4f3', borderRadius: '50%', margin: '0 auto 12px' }} />
                                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#7a7a7a' }}>
                                        Arrastre una imagen aquí o{' '}
                                        <span
                                            onClick={() => !isDisabled && fileInputRef.current?.click()}
                                            style={{ color: '#3a3a3a', fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}
                                        >
                                            seleccione un archivo
                                        </span>
                                    </p>
                                </>
                            )}
                        </div>
                    </FormSection>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e4e4e4' }}>
                        <button
                            type="button"
                            onClick={() => safeNavigate('home')}
                            disabled={isDisabled}
                            style={{
                                background: 'none',
                                border: '1px solid #d4d4d4',
                                borderRadius: 4,
                                padding: '11px 24px',
                                fontSize: 13,
                                color: '#5a5a5a',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.5 : 1,
                            }}
                        >
                            Cancelar
                        </button>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => handleSave('draft')}
                                disabled={isDisabled}
                                style={{
                                    background: '#fff',
                                    border: '1px solid #1e40af',
                                    borderRadius: 4,
                                    padding: '11px 20px',
                                    fontSize: 13,
                                    color: '#1e40af',
                                    fontWeight: 600,
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isDisabled ? 0.5 : 1,
                                }}
                            >
                                {loading ? 'Guardando...' : 'Guardar borrador'}
                            </button>

                            {/* Botón principal de publicación */}
                            <button
                                type="submit"
                                disabled={isDisabled}
                                style={{
                                    background: isDisabled ? '#888' : '#1e40af',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '11px 28px',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isDisabled ? 0.7 : 1,
                                }}
                            >
                                {loading ? 'Guardando...' : conflictos.length > 0 ? 'Publicar de todos modos' : isEdit ? 'Guardar cambios' : 'Publicar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    fontSize: 13,
    color: '#0f1f3d',
    background: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
};

function FormSection({ title, children }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #efefef', background: '#fafafa' }}>
                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>{title}</h2>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        </div>
    );
}

function Field({ label, required, hint, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3a3a3a', marginBottom: 6 }}>
                {label}
                {required && <span style={{ color: '#9a9a9a', marginLeft: 3 }}>*</span>}
            </label>
            {children}
            {hint && <div style={{ fontSize: 11, color: '#7a7a7a', marginTop: 4 }}>{hint}</div>}
        </div>
    );
}