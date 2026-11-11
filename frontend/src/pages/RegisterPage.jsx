import { useState } from 'react';
import { API_BASE_URL } from '../config';

// Creación de cuenta de usuario -- Cristina Pihuave
export default function RegisterPage({ onLoginSuccess, setCurrentPage }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim() || !form.email.trim() || !form.password) {
            setError('Complete los campos obligatorios.');
            return;
        }

        if (form.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (form.password !== form.password_confirmation) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                // Muestra el primer error de validación devuelto por Laravel
                const validacion = data.errors ? Object.values(data.errors)[0][0] : null;
                throw new Error(validacion || data.message || 'Error al crear la cuenta.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setSuccess(true);

            setTimeout(() => {
                if (onLoginSuccess) onLoginSuccess(data.user, data.user.role);
                else setCurrentPage('home');
            }, 1200);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = loading || success;

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>

                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={logoBadgeStyle}>P</div>
                    <h1 style={{ margin: '12px 0 6px', fontSize: 20, fontWeight: 700, color: '#0f1f3d' }}>
                        Crear cuenta
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#6a6a6a' }}>
                        Cree su cuenta para inscribirse en las actividades de la ESPOL
                    </p>
                </div>

                {success && (
                    <div style={successStyle}>
                        Cuenta creada correctamente. Redirigiendo...
                    </div>
                )}

                {error && <div style={errorStyle}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Field label="Nombre completo *">
                        <input
                            value={form.name}
                            onChange={set('name')}
                            placeholder="Nombre y apellido"
                            disabled={isDisabled}
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Correo electrónico *">
                        <input
                            type="email"
                            value={form.email}
                            onChange={set('email')}
                            placeholder="usuario@espol.edu.ec"
                            disabled={isDisabled}
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Contraseña *">
                        <input
                            type="password"
                            value={form.password}
                            onChange={set('password')}
                            placeholder="Mínimo 8 caracteres"
                            disabled={isDisabled}
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Confirmar contraseña *">
                        <input
                            type="password"
                            value={form.password_confirmation}
                            onChange={set('password_confirmation')}
                            placeholder="Repite la contraseña"
                            disabled={isDisabled}
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Tipo de cuenta">
                        <select
                            value={form.role}
                            onChange={set('role')}
                            disabled={isDisabled}
                            style={inputStyle}
                        >
                            <option value="user">Participante</option>
                            <option value="organizer">Organizador</option>
                        </select>
                    </Field>

                    <button
                        type="submit"
                        disabled={isDisabled}
                        style={{
                            ...primaryBtn,
                            opacity: isDisabled ? 0.6 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <p style={{ margin: '20px 0 0', fontSize: 12, color: '#7a7a7a', textAlign: 'center' }}>
                    ¿Ya tiene una cuenta?{' '}
                    <button
                        type="button"
                        onClick={() => setCurrentPage('login')}
                        style={linkBtn}
                    >
                        Inicie sesión
                    </button>
                </p>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#5a5a5a', fontWeight: 500 }}>{label}</label>
            {children}
        </div>
    );
}

const containerStyle = {
    minHeight: '100vh',
    background: '#f3f6fb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
};

const cardStyle = {
    background: '#fff',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '32px 34px',
    width: '100%',
    maxWidth: 420,
};

const logoBadgeStyle = {
    width: 40,
    height: 40,
    background: '#1e40af',
    color: '#fff',
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
};

const inputStyle = {
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    padding: '9px 11px',
    fontSize: 13,
    color: '#0f1f3d',
    background: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
};

const primaryBtn = {
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    marginTop: 4,
};

const linkBtn = {
    background: 'none',
    border: 'none',
    color: '#1e40af',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
    textDecoration: 'underline',
};

const successStyle = {
    background: '#fff',
    color: '#0f1f3d',
    border: '1px solid #d4d4d4',
    padding: '11px 14px',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 18,
    fontWeight: 600,
};

const errorStyle = {
    background: '#fff',
    color: '#0f1f3d',
    border: '1px solid #d4d4d4',
    padding: '11px 14px',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 18,
};
