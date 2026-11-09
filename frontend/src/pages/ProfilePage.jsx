import { useState } from 'react';
import { eventService } from '../services/eventService';
import { FACULTADES, INTERESES } from '../data/catalogos';

// Perfil del usuario con sus datos de cuenta -- Dhamar Patiño

export default function ProfilePage({ user, role, onLogout, setCurrentPage, onUserUpdate }) {
    const [confirmando, setConfirmando] = useState(false);

    // Preferencias usadas por las recomendaciones
    const [faculty, setFaculty] = useState(user?.faculty || '');
    const [career, setCareer] = useState(user?.career || '');
    const [interests, setInterests] = useState(user?.interests || []);
    const [guardando, setGuardando] = useState(false);
    const [aviso, setAviso] = useState(null);

    const alternarInteres = (valor) => {
        setInterests((lista) => (lista.includes(valor) ? lista.filter((i) => i !== valor) : [...lista, valor]));
    };

    const guardarPreferencias = async () => {
        setGuardando(true);
        setAviso(null);
        try {
            const data = await eventService.updateProfile({ faculty: faculty || null, career: career || null, interests });
            if (onUserUpdate) onUserUpdate(data.user);
            setAviso({ ok: true, texto: 'Preferencias guardadas.' });
        } catch (err) {
            setAviso({ ok: false, texto: err.message || 'No se pudieron guardar las preferencias.' });
        } finally {
            setGuardando(false);
        }
    };

    // Nombre legible del tipo de cuenta
    const tipoCuenta = role === 'organizer' ? 'Organizador' : 'Participante';

    // Iniciales para el avatar
    const iniciales = (user?.name || '?')
        .trim()
        .split(' ')
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();

    if (!user) {
        return (
            <div style={{ minHeight: '100vh', background: '#f3f6fb', padding: '80px 40px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#7a7a7a', marginBottom: 20 }}>
                    Inicie sesión para ver su perfil.
                </p>
                <button onClick={() => setCurrentPage('login')} style={primaryBtn}>
                    Iniciar sesión
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f3f6fb' }}>
            <div className="pc-gutter" style={{ maxWidth: 640, margin: '0 auto', padding: '32px 40px 60px' }}>

                <div style={{ marginBottom: 26 }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f1f3d' }}>
                        Mi perfil
                    </h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7a7a7a' }}>
                        Datos de su cuenta en la plataforma.
                    </p>
                </div>

                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                        <div style={avatarStyle}>{iniciales}</div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#0f1f3d' }}>
                                {user.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#7a7a7a' }}>{tipoCuenta}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                        <Dato label="Nombre" valor={user.name} />
                        <Dato label="Correo" valor={user.email} />
                        <Dato label="Tipo de cuenta" valor={tipoCuenta} />
                    </div>

                    <div style={{ borderTop: '1px solid #efefef', paddingTop: 18, marginBottom: 24 }}>
                        <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>Preferencias</h2>
                        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#7a7a7a' }}>
                            Definen las recomendaciones que se muestran en el inicio.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                            <label style={labelStyle}>
                                Facultad
                                <select value={faculty} onChange={(e) => setFaculty(e.target.value)} style={inputStyle}>
                                    <option value="">Sin especificar</option>
                                    {FACULTADES.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </label>
                            <label style={labelStyle}>
                                Carrera
                                <input value={career} onChange={(e) => setCareer(e.target.value)} placeholder="Ej: Ingeniería en Computación" style={inputStyle} />
                            </label>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 600, color: '#3a3a3a', marginBottom: 8 }}>Intereses</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                            {INTERESES.map(({ valor, texto }) => {
                                const activo = interests.includes(valor);
                                return (
                                    <button
                                        key={valor}
                                        type="button"
                                        aria-pressed={activo}
                                        onClick={() => alternarInteres(valor)}
                                        style={{
                                            background: activo ? '#1e40af' : '#fff',
                                            color: activo ? '#fff' : '#3b4a66',
                                            border: `1px solid ${activo ? '#1e40af' : '#c3cfe4'}`,
                                            borderRadius: 14,
                                            padding: '5px 12px',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {texto}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <button onClick={guardarPreferencias} disabled={guardando} style={{ ...primaryBtn, opacity: guardando ? 0.6 : 1 }}>
                                {guardando ? 'Guardando...' : 'Guardar preferencias'}
                            </button>
                            {aviso && (
                                <span style={{ fontSize: 12, color: aviso.ok ? '#1e4620' : '#a94442' }}>{aviso.texto}</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {role === 'organizer' ? (
                            <button onClick={() => setCurrentPage('organizer-dashboard')} style={secondaryBtn}>
                                Ir al panel del organizador
                            </button>
                        ) : (
                            <button onClick={() => setCurrentPage('my-registrations')} style={secondaryBtn}>
                                Ver mis inscripciones
                            </button>
                        )}

                        {!confirmando ? (
                            <button onClick={() => setConfirmando(true)} style={dangerBtn}>
                                Cerrar sesión
                            </button>
                        ) : (
                            <>
                                <button onClick={onLogout} style={dangerBtn}>
                                    Confirmar
                                </button>
                                <button onClick={() => setConfirmando(false)} style={secondaryBtn}>
                                    Cancelar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Dato({ label, valor }) {
    return (
        <div style={{ display: 'flex', gap: 10, fontSize: 13, borderBottom: '1px solid #efefef', paddingBottom: 10 }}>
            <span style={{ minWidth: 120, color: '#9a9a9a' }}>{label}</span>
            <span style={{ color: '#3a3a3a', fontWeight: 500 }}>{valor}</span>
        </div>
    );
}

const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#3a3a3a',
};

const inputStyle = {
    padding: '8px 10px',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'inherit',
    fontWeight: 400,
    color: '#0f1f3d',
    background: '#fff',
};

const cardStyle = {
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '22px 24px',
};

const avatarStyle = {
    width: 52,
    height: 52,
    background: '#1e40af',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 17,
};

const primaryBtn = {
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '10px 18px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
};

const secondaryBtn = {
    background: 'none',
    color: '#5a5a5a',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '9px 16px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
};

const dangerBtn = {
    background: 'none',
    color: '#a94442',
    border: '1px solid #e0b4b4',
    borderRadius: 4,
    padding: '9px 16px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
};
