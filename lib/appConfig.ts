/**
 * Configuración centralizada de la aplicación
 * Reemplaza datos hardcodeados y elimina listas blancas de emails
 */

// Utilidad para logging seguro solo en desarrollo
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

// Configuración de la aplicación
export const APP_CONFIG = {
  // URLs y endpoints
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'https://congreso-api.onrender.com',
    TIMEOUT: 30000, // 30 segundos
  },
  
  // Configuración de autenticación
  AUTH: {
    TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutos en ms
    SESSION_CHECK_INTERVAL: 30 * 1000, // 30 segundos
    COOKIE_NAME: 'cd_jwt',
    STORAGE_KEYS: {
      TOKEN: 'cd_token',
      USER: 'cd_user',
      ROLES: 'cd_user_roles',
    }
  },

  // Configuración de roles y permisos
  ROLES: {
    // Roles de staff (basados en la base de datos)
    STAFF: {
      ADMIN_DEV: 'AdminDev',
      ADMIN: 'Admin',
      ASISTENTE: 'Asistente'
    },
    // Jerarquía de roles (mayor número = mayor privilegio)
    HIERARCHY: {
      AdminDev: 3,  // DevAdmin - acceso completo
      Admin: 2,     // Admin - gestión de contenidos/eventos/usuarios
      Asistente: 1, // Asistente - escaneo y marcaje de asistencias
      Student: 0    // Estudiante - acceso básico
    }
  },

  // Rutas de la aplicación
  ROUTES: {
    PUBLIC: [
      '/',
      '/login',
      '/register',
      '/about',
      '/speakers',
      '/schedule',
      '/podio',
      '/inscripcion'
    ],
    AUTHENTICATED: [
      '/dashboard',
      '/profile',
      '/portal',
      '/inscripcion/mis-inscripciones',
      '/portal/qr',
      '/portal/inscripciones'
    ],
    STAFF: [
      '/staff',
      '/asistencia'
    ],
    ADMIN: [
      '/admin',
      '/admin/usuarios',
      '/admin/participantes',
      '/admin/actividades'
    ],
    // Rutas de redirección por defecto según rol
    DEFAULT_BY_ROLE: {
      AdminDev: '/admin',
      Admin: '/admin', 
      Asistente: '/staff',
      Student: '/portal'
    }
  },

  // Configuración de UI
  UI: {
    // Timeouts para notificaciones
    NOTIFICATION_TIMEOUT: 3000,
    SUCCESS_MESSAGE_TIMEOUT: 3000,
    ERROR_MESSAGE_TIMEOUT: 5000,
    
    // Paginación
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    
    // Intervalos de actualización
    DATA_REFRESH_INTERVAL: 30000, // 30 segundos
    
    // Límites de caracteres
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_NAME_LENGTH: 100,
    
    // Configuración de tablas
    TABLE_ACTIONS: {
      EDIT: 'edit',
      DELETE: 'delete',
      VIEW: 'view'
    }
  },

  // Configuración de validación
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    
    // Dominios permitidos para registro (si se requiere restricción)
    // NOTA: Eliminamos la lista blanca de emails específicos
    ALLOWED_DOMAINS: process.env.NEXT_PUBLIC_ALLOWED_DOMAINS?.split(',') || [],
    
    // Validación de archivos
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  },

  // Configuración de desarrollo
  DEV: {
    USE_MOCK_DATA: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK === 'true',
    ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
    SHOW_DEV_TOOLS: process.env.NODE_ENV === 'development'
  },

  // Configuración de la organización
  ORGANIZATION: {
    NAME: 'Universidad Mariano Gálvez',
    SHORT_NAME: 'UMG',
    DOMAIN: 'umg.edu.gt',
    CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@umg.edu.gt',
    SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte@umg.edu.gt'
  },

  // Configuración del congreso
  CONGRESS: {
    NAME: 'Congreso Digital UMG',
    YEAR: new Date().getFullYear(),
    CURRENT_EDITION: process.env.NEXT_PUBLIC_CONGRESS_EDITION || '2025',
    
    // Estados de actividades
    ACTIVITY_STATES: {
      DRAFT: 'draft',
      PUBLISHED: 'published',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed'
    },
    
    // Estados de inscripciones
    ENROLLMENT_STATES: {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled',
      ATTENDED: 'attended'
    }
  }
} as const;

// Tipos derivados de la configuración
export type StaffRole = keyof typeof APP_CONFIG.ROLES.HIERARCHY;
export type PublicRoute = typeof APP_CONFIG.ROUTES.PUBLIC[number];
export type AuthenticatedRoute = typeof APP_CONFIG.ROUTES.AUTHENTICATED[number];
export type StaffRoute = typeof APP_CONFIG.ROUTES.STAFF[number];
export type AdminRoute = typeof APP_CONFIG.ROUTES.ADMIN[number];

// Funciones de utilidad para la configuración
export const ConfigUtils = {
  /**
   * Verifica si una ruta es pública
   */
  isPublicRoute(route: string): boolean {
    return APP_CONFIG.ROUTES.PUBLIC.includes(route as PublicRoute);
  },

  /**
   * Verifica si una ruta requiere autenticación
   */
  requiresAuth(route: string): boolean {
    return !this.isPublicRoute(route);
  },

  /**
   * Obtiene la ruta por defecto para un rol
   */
  getDefaultRouteForRole(role: StaffRole): string {
    return APP_CONFIG.ROUTES.DEFAULT_BY_ROLE[role] || '/dashboard';
  },

  /**
   * Verifica si un dominio está permitido para registro
   */
  isDomainAllowed(email: string): boolean {
    if (APP_CONFIG.VALIDATION.ALLOWED_DOMAINS.length === 0) {
      return true; // Si no hay restricciones, permitir todos
    }
    
    const domain = email.split('@')[1]?.toLowerCase();
    return APP_CONFIG.VALIDATION.ALLOWED_DOMAINS.some(
      allowedDomain => domain === allowedDomain.toLowerCase()
    );
  },

  /**
   * Obtiene el nivel de jerarquía de un rol
   */
  getRoleLevel(role: StaffRole): number {
    return APP_CONFIG.ROLES.HIERARCHY[role] || 0;
  },

  /**
   * Verifica si un rol tiene mayor o igual privilegio que otro
   */
  hasRolePrivilege(userRole: StaffRole, requiredRole: StaffRole): boolean {
    return this.getRoleLevel(userRole) >= this.getRoleLevel(requiredRole);
  }
};

export default APP_CONFIG;