import React, { useState, useEffect } from 'react';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import FacultiesPage from './pages/FacultiesPage';
import CalendarPage from './pages/CalendarPage';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import CreateEventPage from './pages/CreateEventPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetailPage from './pages/EventDetailPage';
import AttendancePage from './pages/AttendancePage';
import useEsMovil from './hooks/useEsMovil';

// Paginas de gestion que solo se ofrecen en la version web
const PAGINAS_SOLO_WEB = ['organizer-dashboard', 'create-event', 'edit-event'];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Dato que se envia a la pagina destino: id del evento o facultad -- Cristina Pihuave
  const [navParam, setNavParam] = useState(null);

  // Cambia de pagina y pasa el dato asociado -- Cristina Pihuave
  const navigate = (page, param = null) => {
    setNavParam(param);
    setCurrentPage(page);
  };

  // Estado de autenticación y rol
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('public');
  const [user, setUser] = useState(null);
  const esMovil = useEsMovil();

  // Guarda los cambios del perfil en la sesion
  const handleUserUpdate = (nuevo) => {
    setUser(nuevo);
    localStorage.setItem('user', JSON.stringify(nuevo));
  };

  // Abre el detalle si la direccion trae ?evento=N -- Cristina Pihuave
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventoId = params.get('evento');

    if (eventoId) {
      setNavParam(eventoId);
      setCurrentPage('event-detail');
    }
  }, []);

  // 1. PERSISTENCIA AL RECARGAR (Lee token y datos de localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setRole(parsedUser.role || 'user');
      setIsLoggedIn(true);
    }
  }, []);

  // 2. MANEJO DE LOGIN EXITOSO
  const handleLoginSuccess = (userData, userRole) => {
    // Si userRole no se envía explícitamente, se extrae de userData.role
    const detectedRole = userRole || userData?.role || 'user';

    setUser(userData);
    setRole(detectedRole);
    setIsLoggedIn(true);
    setCurrentPage('home');
  };

  // 3. MANEJO DE CERRAR SESIÓN
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRole('public');
    setIsLoggedIn(false);
    setCurrentPage('home');
  };

  // Switch de renderizado dinámico de páginas -- Dhamar Patiño
  const renderPage = () => {
    if (esMovil && PAGINAS_SOLO_WEB.includes(currentPage)) {
      return (
        <div className="pc-gutter" style={{ padding: '60px 16px', textAlign: 'center', fontSize: 14, color: '#3b4a66' }}>
          La gestión de publicaciones está disponible en la versión web.
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return <HomePage key="home" setCurrentPage={navigate} user={user} facultyFilter={navParam} />;
      case 'opportunities':
        return <HomePage key="opportunities" setCurrentPage={navigate} user={user} soloOportunidades />;
      case 'faculties':
        return <FacultiesPage setCurrentPage={navigate} />;
      case 'calendar':
        return <CalendarPage setCurrentPage={navigate} />;
      case 'event-detail':
        return <EventDetailPage eventId={navParam} setCurrentPage={navigate} user={user} />;
      case 'my-registrations':
        return <MyRegistrationsPage user={user} setCurrentPage={navigate} />;
      case 'organizer-dashboard':
        return <OrganizerDashboardPage user={user} setCurrentPage={navigate} />;
      case 'attendance':
        return <AttendancePage key={navParam ?? 'lista'} eventId={navParam} setCurrentPage={navigate} />;
      case 'create-event':
        return <CreateEventPage user={user} setCurrentPage={navigate} navigate={navigate} />;
      case 'edit-event':
        return <CreateEventPage user={user} setCurrentPage={navigate} navigate={navigate} mode="edit" eventId={navParam} />;
      case 'profile':
        return <ProfilePage user={user} role={role} onLogout={handleLogout} setCurrentPage={navigate} onUserUpdate={handleUserUpdate} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} setCurrentPage={navigate} navigate={navigate} />;
      case 'register':
        return <RegisterPage onLoginSuccess={handleLoginSuccess} setCurrentPage={navigate} />;
      default:
        return <HomePage setCurrentPage={navigate} user={user} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER GLOBAL */}
      <Header
        currentPage={currentPage}
        setCurrentPage={navigate}
        role={role}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setCurrentPage('login')}
        onOpenRegister={() => setCurrentPage('register')}
      />

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
    </div>
  );
}