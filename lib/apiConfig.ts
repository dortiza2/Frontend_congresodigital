/**
 * Configuración centralizada de la API
 * Este archivo reemplaza las configuraciones mock distribuidas en varios archivos
 */

// Configuración base de la API
export const API_CONFIG = {
  // Unificar nombres: usar NEXT_PUBLIC_API_URL (cliente) y API_BASE_URL o API_URL (SSR)
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:5213',
  TIMEOUT: 10000, // 10 segundos
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Endpoints de la API
export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/me',
    SESSION: '/api/auth/session'
  },

  // Usuarios
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
    STATS: '/users/stats'
  },

  // Actividades
  ACTIVITIES: {
    LIST: '/admin/activities',
    CREATE: '/admin/activities',
    GET_BY_ID: (id: string) => `/admin/activities/${id}`,
    UPDATE: (id: string) => `/admin/activities/${id}`,
    DELETE: (id: string) => `/admin/activities/${id}`,
    PUBLIC_LIST: '/api/activities',
    PUBLISH: (id: string) => `/admin/activities/${id}`,
    UNPUBLISH: (id: string) => `/admin/activities/${id}`,
    STATS: '/activities/stats',
    ENROLL: '/activities/enroll'
  },

  // Inscripciones
  ENROLLMENTS: {
    LIST: '/enrollments',
    CREATE: '/enrollments',
    GET_BY_ID: (id: string) => `/enrollments/${id}`,
    UPDATE: (id: string) => `/enrollments/${id}`,
    DELETE: (id: string) => `/enrollments/${id}`,
    BY_USER: (userId: string) => `/users/${userId}/enrollments`,
    BY_ACTIVITY: (activityId: string) => `/activities/${activityId}/enrollments`,
    MARK_ATTENDANCE: (id: string) => `/enrollments/${id}/attendance`,
    MARK_ATTENDANCE_BY_QR: '/enrollments/attendance/qr',
    SEND_EMAIL: (id: string) => `/enrollments/${id}/email`
  },

  // Contactos
  CONTACTS: {
    LIST: '/contacts',
    CREATE: '/contacts',
    GET_BY_ID: (id: string) => `/contacts/${id}`,
    UPDATE: (id: string) => `/contacts/${id}`,
    DELETE: (id: string) => `/contacts/${id}`,
    CLEAR: '/contacts/clear'
  },

  // Registros
  REGISTRATIONS: {
    LIST: '/registrations',
    CREATE: '/registrations',
    GET_BY_ID: (id: string) => `/registrations/${id}`,
    UPDATE: (id: string) => `/registrations/${id}`,
    DELETE: (id: string) => `/registrations/${id}`,
    CLEAR: '/registrations/clear'
  },

  // Speakers
  SPEAKERS: {
    LIST: '/admin/speakers',
    CREATE: '/admin/speakers',
    GET_BY_ID: (id: string) => `/admin/speakers/${id}`,
    UPDATE: (id: string) => `/admin/speakers/${id}`,
    DELETE: (id: string) => `/admin/speakers/${id}`,
    PUBLIC_LIST: '/api/speakers'
  },

  // Winners
  WINNERS: {
    LIST: '/api/winners',
    BY_YEAR: (year: string) => `/api/winners?year=${year}`
  },

  // Podium (endpoint público)
  PODIUM: {
    BY_YEAR: (year: string) => `/api/podium?year=${year}`
  },

  // STAFF
  STAFF: {
    STATS: '/api/staff/stats',
    SCAN: '/api/staff/scan',
    INVITE: '/api/staff/invite',
    INVITATIONS: '/api/staff/invitations',
    REVOKE: (id: string) => `/api/staff/invitations/${id}`,
    ALL: '/api/staff/all',
    SEARCH: '/api/staff/search',
    BY_ROLE: (role: string) => `/api/staff/role/${role}`,
    UPDATE_ROLE: (id: string) => `/api/staff/${id}/role`,
    UPDATE_STATUS: (id: string) => `/api/staff/${id}/status`,
    ATTENDANCE_HISTORY: '/api/staff/attendance-history'
  },

  // FAQ
  FAQ: {
    LIST: '/api/faq'
  },

  // STUDENT
  STUDENT: {
    PROFILE: '/api/student/profile',
    CERTIFICATES: '/api/student/certificates',
    GENERATE_CERTIFICATE: (id: string) => `/api/student/certificates/${id}/generate`,
    ENROLLMENTS: '/api/student/enrollments'
  },

  // CERTIFICATES
  CERTIFICATES: {
    LIST: '/api/certificates',
    BY_USER: (userId: string) => `/api/certificates?userId=${userId}`,
    GENERATE: '/api/certificates/generate',
    DOWNLOAD: (hash: string) => `/api/certificates/${hash}/download`,
    VALIDATE: (hash: string) => `/api/certificates/${hash}/validate`
  },

  // ADMIN
  ADMIN: {
    ACTIVITIES: '/admin/activities',
    ACTIVITY_STATS: '/admin/activities/stats'
  }

};

// Configuración de desarrollo vs producción
/**
 * Configuración centralizada para la API
 * Maneja URLs, endpoints, autenticación y modo de desarrollo
 */

// Configuración de modo de desarrollo
export const USE_MOCK_DATA = false; // Cambiado a false para usar API real

// Headers de autenticación
export const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    ...API_CONFIG.HEADERS,
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Función helper para manejar errores de API
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Error desconocido en la API';
};