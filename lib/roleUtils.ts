/**
 * Utilidades unificadas para el manejo de roles en el sistema de identidad única
 * Soporta staff_roles: AdminDev, Admin, Asistente y perfil de estudiante
 */

import { APP_CONFIG, ConfigUtils, type StaffRole } from './appConfig';

// Definición de staff roles del sistema (desde configuración centralizada)
export const STAFF_ROLES = APP_CONFIG.ROLES.STAFF;

// Tipos de perfil
export const PROFILE_TYPES = {
  STAFF: 'staff',
  STUDENT: 'student'
} as const;

export type StaffRoleCode = typeof STAFF_ROLES[keyof typeof STAFF_ROLES];
export type ProfileType = typeof PROFILE_TYPES[keyof typeof PROFILE_TYPES];

// Jerarquía de staff roles (desde configuración centralizada)
const STAFF_ROLE_HIERARCHY = APP_CONFIG.ROLES.HIERARCHY;

// Roles administrativos (calculados dinámicamente)
const ADMIN_STAFF_ROLES: StaffRoleCode[] = [STAFF_ROLES.ADMIN_DEV, STAFF_ROLES.ADMIN];
const ALL_STAFF_ROLES: StaffRoleCode[] = Object.values(STAFF_ROLES);

// Interface para usuario con nuevo modelo
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  profileType: ProfileType;
  staffRole?: StaffRoleCode;
  roleLevel?: number; // 3=AdminDev, 2=Admin, 1=Asistente, 0=Student
  isUmg: boolean;
  orgName?: string;
}

/**
 * Verifica si un usuario tiene un staff role específico
 */
export function hasStaffRole(user: UserProfile, targetRole: StaffRoleCode): boolean {
  return user.profileType === PROFILE_TYPES.STAFF && user.staffRole === targetRole;
}

/**
 * Verifica si un usuario tiene alguno de los staff roles especificados
 */
export function hasAnyStaffRole(user: UserProfile, targetRoles: StaffRoleCode[]): boolean {
  return user.profileType === PROFILE_TYPES.STAFF && 
         user.staffRole !== undefined && 
         targetRoles.includes(user.staffRole);
}

/**
 * Obtiene el nivel de jerarquía del staff role del usuario
 */
export function getStaffRoleLevel(user: UserProfile): number {
  if (user.profileType !== PROFILE_TYPES.STAFF || !user.staffRole) {
    return 0;
  }
  return STAFF_ROLE_HIERARCHY[user.staffRole] || 0;
}

/**
 * Verifica si un usuario es administrador (AdminDev o Admin)
 */
export function isAdmin(user: UserProfile): boolean {
  return hasAnyStaffRole(user, ADMIN_STAFF_ROLES);
}

/**
 * Verifica si un usuario es staff (cualquier staff role)
 */
export function isStaff(user: UserProfile): boolean {
  return user.profileType === PROFILE_TYPES.STAFF && user.staffRole !== undefined;
}

/**
 * Verifica si un usuario es estudiante
 */
export function isStudent(user: UserProfile): boolean {
  return user.profileType === PROFILE_TYPES.STUDENT;
}

/**
 * Verifica si un usuario es super admin (AdminDev)
 */
export function isAdminDev(user: UserProfile): boolean {
  return hasStaffRole(user, STAFF_ROLES.ADMIN_DEV);
}

/**
 * Obtiene la ruta de redirección por defecto según el perfil del usuario
 */
export function getDefaultRouteByProfile(user: UserProfile): string {
  // Usar roleLevel si está disponible (más robusto)
  if (user.roleLevel !== undefined) {
    if (user.roleLevel === 3) {
      return '/dashboard'; // AdminDev - acceso a dashboard
    }
    if (user.roleLevel === 2) {
      return '/dashboard'; // Admin - acceso a dashboard
    }
    if (user.roleLevel === 1) {
      return '/dashboard'; // Asistente - acceso a dashboard
    }
    if (user.roleLevel === 0) {
      return '/mi-cuenta'; // Student - mi cuenta
    }
    if (user.roleLevel === 4) {
      return '/mi-cuenta'; // Usuario especial - mi cuenta
    }
  }
  
  // Fallback al sistema anterior basado en staffRole
  if (user.profileType === PROFILE_TYPES.STAFF) {
    switch (user.staffRole) {
      case STAFF_ROLES.ADMIN_DEV:
      case STAFF_ROLES.ADMIN:
        return '/dashboard';
      case STAFF_ROLES.ASISTENTE:
        return '/dashboard';
      default:
        return '/mi-cuenta';
    }
  }
  
  // Estudiante
  return '/mi-cuenta';
}

/**
 * Obtiene el texto del botón del dashboard según el perfil del usuario
 * roleLevel≤3 = "Dashboard", roleLevel===0 o 4 = "Mi Cuenta"
 */
export function getDashboardButtonText(user: UserProfile): string {
  const roleLevel = user.roleLevel || 0; // Default para estudiantes
  
  if (roleLevel === 0 || roleLevel === 4) {
    return 'Mi Cuenta'; // Para estudiantes (roleLevel 0) y usuarios especiales (roleLevel 4)
  }
  
  return 'Dashboard'; // Para todos los demás (roleLevel 1, 2, 3)
}

/**
 * Obtiene la ruta del botón del dashboard según el perfil del usuario
 */
export function getDashboardButtonRoute(user: UserProfile): string {
  return getDefaultRouteByProfile(user);
}

/**
 * Verifica si un usuario puede acceder a una ruta específica
 */
export function canAccessRoute(user: UserProfile, route: string): boolean {
  // Rutas públicas (siempre permitidas)
  const publicRoutes = ['/', '/login', '/register', '/about', '/speakers', '/schedule', '/inscripcion'];
  if (publicRoutes.includes(route)) {
    return true;
  }

  // Obtener roleLevel del usuario
  const roleLevel = user.roleLevel || 0;

  // Rutas específicas por rol
  if (route.startsWith('/mi-cuenta')) {
    // Permitido para estudiantes (roleLevel 0) y usuarios con roleLevel 4
    return roleLevel === 0 || roleLevel === 4;
  }

  if (route.startsWith('/inscripcion')) {
    // Permitido para estudiantes (roleLevel 0) y páginas públicas
    return roleLevel === 0;
  }

  if (route.startsWith('/portal')) {
    // Permitido solo para asistentes y superiores (roleLevel >= 1)
    return roleLevel >= 1;
  }

  if (route.startsWith('/admin')) {
    // Permitido solo para admins y superiores (roleLevel >= 2)
    return roleLevel >= 2;
  }

  if (route.startsWith('/dashboard')) {
    // Permitido para todos los usuarios con roleLevel <= 3
    return roleLevel <= 3;
  }

  // Rutas de staff
  const staffRoutes = ['/staff'];
  if (staffRoutes.includes(route)) {
    return isStaff(user);
  }

  // Rutas generales para usuarios autenticados
  const generalRoutes = ['/profile', '/qr'];
  if (generalRoutes.includes(route)) {
    return true; // Todos los usuarios autenticados pueden acceder
  }

  // Por defecto, denegar acceso
  return false;
}

/**
 * Obtiene la descripción del staff role
 */
export function getStaffRoleDescription(staffRole: StaffRoleCode): string {
  switch (staffRole) {
    case STAFF_ROLES.ADMIN_DEV:
      return 'Administrador de Desarrollo';
    case STAFF_ROLES.ADMIN:
      return 'Administrador';
    case STAFF_ROLES.ASISTENTE:
      return 'Asistente';
    default:
      return 'Rol desconocido';
  }
}

/**
 * Obtiene la descripción del perfil del usuario
 */
export function getProfileDescription(user: UserProfile): string {
  if (user.profileType === PROFILE_TYPES.STAFF && user.staffRole) {
    return getStaffRoleDescription(user.staffRole);
  }
  
  if (user.profileType === PROFILE_TYPES.STUDENT) {
    return user.isUmg ? 'Estudiante UMG' : `Estudiante - ${user.orgName || 'Externa'}`;
  }
  
  return 'Usuario';
}

/**
 * Obtiene las rutas permitidas para un usuario
 */
export function getAllowedRoutes(user: UserProfile): string[] {
  const routes = ['/', '/dashboard', '/profile', '/inscripciones', '/qr'];
  
  if (isStaff(user)) {
    routes.push('/staff');
  }
  
  if (isAdmin(user)) {
    routes.push('/admin');
  }
  
  return routes;
}

/**
 * Verifica si un usuario puede realizar una acción específica
 */
export function canPerformAction(user: UserProfile, action: string): boolean {
  switch (action) {
    case 'manage_users':
    case 'manage_activities':
    case 'view_reports':
      return isAdmin(user);
    
    case 'scan_qr':
    case 'check_attendance':
      return isStaff(user);
    
    case 'enroll_activities':
    case 'view_profile':
      return true; // Todos los usuarios autenticados
    
    default:
      return false;
  }
}

/**
 * Función de compatibilidad para verificar si un array de roles contiene un rol específico
 * Mapea los roles de la base de datos a los roles esperados por el frontend
 */
export function hasRole(userRoles: string[], targetRole: string): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  
  // Mapeo de roles de base de datos a roles del frontend
  const roleMapping: Record<string, string[]> = {
    'MGADMIN': ['DVADMIN', 'MGADMIN', 'AdminDev'],
    'ADMIN': ['ADMIN', 'Admin'],
    'ASISTENTE': ['ASISTENTE', 'Asistente']
  };
  
  // Si el rol objetivo tiene mapeo, verificar cualquiera de los roles mapeados
  if (roleMapping[targetRole]) {
    return roleMapping[targetRole].some(mappedRole => userRoles.includes(mappedRole));
  }
  
  // Si no hay mapeo, verificar directamente
  return userRoles.includes(targetRole);
}