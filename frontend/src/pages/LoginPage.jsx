import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function Login({ onLoginSuccess, navigate }) {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

            // Guardar Token y datos de usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (onLoginSuccess) {
                onLoginSuccess(data.user);
            }

            if (typeof navigate === 'function') {
                navigate('home');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                
                {/* Encabezado con el distintivo de PoliConecta */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={logoBadgeStyle}>P</div>
                    <h1 style={{ margin: '12px 0 6px', fontSize: 20, fontWeight: 700, color: '#0f1f3d' }}>
                        Iniciar sesión
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#6a6a6a' }}>
                        Ingrese sus credenciales para acceder a la plataforma
                    </p>
                </div>

                {/* Notificación de Error */}
                {error && (
                    <div style={errorStyle}>
                        {error}
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                        <label style={labelStyle}>Correo institucional</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="usuario@espol.edu.ec"
                            value={credentials.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            background: loading ? '#888' : '#0f1f3d',
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>

            </div>
        </div>
    );
}

// Estilos centrados y estilizados
const containerStyle = {
    minHeight: 'calc(100vh - 80px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f6fb',
    padding: '40px 20px',
};

const cardStyle = {
    width: '100%',
    maxWidth: 400,
    background: '#ffffff',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    padding: '36px 32px',
    boxSizing: 'border-box',
};

const logoBadgeStyle = {
    width: 42,
    height: 42,
    background: '#0f1f3d',
    color: '#fff',
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 18,
};

const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#3a3a3a',
    marginBottom: 6,
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d4d4d4',
    borderRadius: 4,
    fontSize: 13,
    color: '#0f1f3d',
    background: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
};

const buttonStyle = {
    width: '100%',
    padding: '12px',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 6,
    fontFamily: 'inherit',
};

const errorStyle = {
    background: '#fff',
    color: '#0f1f3d',
    border: '1px solid #d4d4d4',
    padding: '10px 14px',
    borderRadius: 4,
    fontSize: 12,
    marginBottom: 18,
};