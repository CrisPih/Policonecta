import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Header({
    currentPage,
    setCurrentPage,
    role = 'public', // 'public' | 'user' | 'organizer'
    isLoggedIn = false,
    user = null, // Datos reales del backend / BD: { name, initials, email, ... }
    onLogout,
    onOpenLogin,
    onOpenRegister,
    }) {
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Helper para obtener las iniciales dinámicamente si no vienen explícitas
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const userName = user?.name || user?.fullName || 'Usuario';
    const userInitials = user?.initials || getInitials(userName);

    const handleLoginClick = () => {
        if (onOpenLogin) onOpenLogin();
        else setCurrentPage('login');
    };

    const handleRegisterClick = () => {
        if (onOpenRegister) onOpenRegister();
        else setCurrentPage('register');
    };

    const handleLogoutClick = () => {
        setShowUserMenu(false);
        if (onLogout) onLogout();
        else setCurrentPage('home');
    };

    return (
        <header
        style={{
            width: '100%',
            background: '#fff',
            borderBottom: '1px solid #e5e5e5',
            position: 'sticky',
            top: 0,
            zIndex: 100,
        }}
        >
        <div
            className="pc-header"
            style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxSizing: 'border-box',
            }}
        >
            {/* LOGO & NOMBRE */}
            <div
            onClick={() => setCurrentPage('home')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
            <div
                style={{
                width: 34,
                height: 34,
                background: '#1e40af',
                color: '#fff',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                }}
            >
                P
            </div>
            <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d', lineHeight: 1.1 }}>
                PoliConecta
                </div>
                <div style={{ fontSize: 9, color: '#5b6b88', }}>
                Comunidad ESPOL
                </div>
            </div>
            </div>

            {/* NAVEGACIÓN PRINCIPAL */}
            <nav className="pc-nav" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <button
                onClick={() => setCurrentPage('home')}
                style={navBtnStyle(currentPage === 'home')}
            >
                Inicio
            </button>

            <button
                onClick={() => setCurrentPage('opportunities')}
                style={navBtnStyle(currentPage === 'opportunities')}
            >
                Oportunidades
            </button>

            <button
                onClick={() => setCurrentPage('faculties')}
                style={navBtnStyle(currentPage === 'faculties')}
            >
                Facultades
            </button>

            <button
                onClick={() => setCurrentPage('calendar')}
                style={navBtnStyle(currentPage === 'calendar')}
            >
                Calendario
            </button>

    {/* Rutas de Usuario (Estudiante/Asistente) */}
            {isLoggedIn && role === 'user' && (
                <button
                onClick={() => setCurrentPage('my-registrations')}
                style={navBtnStyle(currentPage === 'my-registrations')}
                >
                Mis inscripciones
                </button>
            )}

            {/* Rutas de organizador, solo en la version web */}
            {isLoggedIn && role === 'organizer' && (
                <span className="pc-solo-web" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <button
                    onClick={() => setCurrentPage('organizer-dashboard')}
                    style={navBtnStyle(currentPage === 'organizer-dashboard')}
                >
                    Panel
                </button>
                <button
                    onClick={() => setCurrentPage('create-event')}
                    style={{
                    background: '#1e40af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    }}
                >
                    Crear publicación
                </button>
                </span>
            )}

            {/* En el telefono el organizador solo registra asistencia */}
            {isLoggedIn && role === 'organizer' && (
                <button
                    className="pc-solo-movil"
                    onClick={() => setCurrentPage('attendance')}
                    style={navBtnStyle(currentPage === 'attendance')}
                >
                    Asistencia
                </button>
            )}
            </nav>

    {/* ÁREA DERECHA: AUTENTICACIÓN / DATOS DINÁMICOS DEL USUARIO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            {!isLoggedIn || role === 'public' ? (
                <>
                <button
                    onClick={handleLoginClick}
                    style={{
                    background: 'none',
                    border: '1px solid #d4d4d4',
                    borderRadius: 4,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#333',
                    }}
                >
                    Iniciar sesión
                </button>
                <button
                    onClick={handleRegisterClick}
                    style={{
                    background: 'none',
                    border: '1px solid #d4d4d4',
                    borderRadius: 4,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#333',
                    }}
                >
                    Registrarse
                </button>
                </>
            ) : (
                /* MENÚ DEL USUARIO/ORGANIZADOR AUTENTICADO */
            <>
            <NotificationBell setCurrentPage={setCurrentPage} />
            <div style={{ position: 'relative' }}>
                <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    userSelect: 'none',
                    }}
                >
                    {/* Iniciales dinámicas */}
                    <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: role === 'organizer' ? '#1e3a8a' : '#1e40af', // Color distinto si es organizador
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                    >
                    {userInitials}
                    </div>
                    {/* Nombre dinámico traído del backend / BD */}
                    <span className="pc-solo-web" style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>
                    {userName}
                    </span>
                </div>

                {/* MENÚ DESPLEGABLE */}
                {showUserMenu && (
                    <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        background: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        width: 160,
                        zIndex: 200,
                        overflow: 'hidden',
                    }}
                    >
                    <button
                        onClick={() => {
                        setCurrentPage('profile');
                        setShowUserMenu(false);
                        }}
                        style={dropdownItemStyle}
                    >
                        Mi perfil
                    </button>
                    <button
                        onClick={handleLogoutClick}
                        style={{ ...dropdownItemStyle, color: '#1e40af', borderTop: '1px solid #f0f0f0' }}
                    >
                        Cerrar sesión
                    </button>
                    </div>
                )}
                </div>
            </>
            )}
            </div>
        </div>
        </header>
    );
}

function navBtnStyle(active) {
    return {
        background: 'none',
        border: 'none',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? '#0f1f3d' : '#666',
        borderBottom: active ? '2px solid #1e40af' : '2px solid transparent',
        padding: '8px 0',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        fontFamily: 'inherit',
    };
}

const dropdownItemStyle = {
    width: '100%',
    padding: '10px 14px',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    fontSize: 13,
    color: '#333',
    cursor: 'pointer',
    fontFamily: 'inherit',
};