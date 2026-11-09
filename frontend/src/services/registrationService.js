import { API_BASE_URL } from '../config';
// src/services/registrationService.js



// Las rutas de inscripciones requieren sesion iniciada
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Servicio de inscripciones a eventos -- Cristina Pihuave
export const registrationService = {
  // 1. Inscribir a un participante en un evento
  register: async (eventId, participant) => {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/registrations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(participant),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Debes iniciar sesión para inscribirte en un evento.');
      }
      throw new Error(data.message || 'Error al registrar la participación.');
    }

    return data;
  },

  // 2. Cancelar una inscripción
  cancel: async (eventId, registrationId) => {
    const response = await fetch(
      `${API_BASE_URL}/events/${eventId}/registrations/${registrationId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Error al cancelar la participación.');
    }

    return data;
  },

  // 3. Consultar los participantes inscritos en un evento
  getByEvent: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/registrations`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Error al consultar los participantes.');
    return await response.json();
  },

  // 4. Consultar las inscripciones de un participante por su correo
  getByParticipant: async (email) => {
    const response = await fetch(
      `${API_BASE_URL}/registrations?email=${encodeURIComponent(email)}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) throw new Error('No se pudieron consultar las inscripciones.');
    const data = await response.json();
    return data.registrations;
  },
};
