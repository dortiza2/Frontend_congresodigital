/**
 * Cliente de autenticación para manejo de tokens JWT
 * Maneja persistencia en cookies y localStorage
 */

const COOKIE_NAME = 'cd_jwt';
const TOKEN_KEY = 'cd_token';
const USER_KEY = 'cd_user';

import type { User } from '@/types/auth';
import { APP_CONFIG } from './appConfig';
import { getCurrentUserEnrollmentsSummary } from '@/services/enrollments';

/**
 * Establece una cookie con el token JWT
 */
function setCookie(name: string, value: string, expiresAt: string): void {
  if (typeof window === 'undefined') return;
  
  const expires = new Date(expiresAt).toUTCString();
  const isSecure = window.location.protocol === 'https:';
  
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

/**
 * Obtiene el valor de una cookie
 */
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  
  return null;
}

/**
 * Elimina una cookie
 */
function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

/**
 * Extrae roles del JWT token
 */
function getRolesFromJWT(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Intentar extraer roles de diferentes claims posibles
    if (payload.role) {
      // Si 'role' es un array
      if (Array.isArray(payload.role)) {
        return payload.role;
      }
      // Si 'role' es un string separado por comas
       if (typeof payload.role === 'string') {
         return payload.role.split(',').map((r: string) => r.trim());
       }
    }
    
    // Intentar con claim 'roles'
    if (payload.roles) {
      if (Array.isArray(payload.roles)) {
        return payload.roles;
      }
      if (typeof payload.roles === 'string') {
         return payload.roles.split(',').map((r: string) => r.trim());
       }
    }
    
    // Intentar con claim personalizado del backend
    if (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
      const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (Array.isArray(roles)) {
        return roles;
      }
      return [roles];
    }
    
    return [];
  } catch {
    return [];
  }
}

/**
 * Obtiene los roles del usuario priorizando JWT sobre localStorage
 */
export function getUserRoles(): string[] {
  if (typeof window === 'undefined') return [];
  
  // PRIORIZAR JWT: extraer roles del token
  const token = getToken();
  if (token) {
    const jwtRoles = getRolesFromJWT(token);
    if (jwtRoles.length > 0) {
      return jwtRoles;
    }
  }
  
  // FALLBACK: usar localStorage solo si el JWT no tiene roles
  try {
    const roles = localStorage.getItem('cd_user_roles');
    return roles ? JSON.parse(roles) : [];
  } catch {
    return [];
  }
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 */
export function hasAnyRole(requiredRoles: string[]): boolean {
  const userRoles = getUserRoles();
  return requiredRoles.some(role => userRoles.includes(role));
}



/**
 * Valida y obtiene la ruta de redirección segura
 */
export function getRedirectPath(next?: string): string {
  // Si se proporciona un parámetro 'next', validarlo
  if (next) {
    // Debe empezar con '/' y estar en las rutas permitidas
    if (next.startsWith('/')) {
      const allowedRoutes = [
        ...APP_CONFIG.ROUTES.PUBLIC,
        ...APP_CONFIG.ROUTES.AUTHENTICATED,
        ...APP_CONFIG.ROUTES.STAFF,
        ...APP_CONFIG.ROUTES.ADMIN
      ];
      
      const isAllowed = allowedRoutes.some((allowed: string) => 
        next === allowed || next.startsWith(allowed + '/')
      );
      
      if (isAllowed) {
        return next;
      }
    }
  }
  
  // Si no hay 'next' válido, usar ruta por defecto según roleLevel o roles
  const user = getUser();
  if (user?.roleLevel) {
    return getDefaultRouteByRoleLevel(user.roleLevel);
  }
  
  // Fallback a roles si no hay roleLevel
  const userRoles = getUserRoles();
  return getDefaultRouteByRole(userRoles);
}

/**
 * Helper function para obtener la ruta por defecto según roleLevel
 * Más robusto que usar roles específicos
 */
export function getDefaultRouteByRoleLevel(roleLevel: number): string {
  // roleLevel: 3=AdminDev, 2=Admin, 1=Asistente, 0=Student
  
  if (roleLevel === 3) {
    return '/admin'; // AdminDev - Acceso completo a admin
  }
  
  if (roleLevel === 2) {
    return '/dashboard'; // Admin - Acceso a dashboard
  }
  
  if (roleLevel === 1) {
    return '/dashboard'; // Asistente - Acceso a dashboard
  }
  
  if (roleLevel === 0) {
    return '/mi-cuenta'; // Student - Mi Cuenta (default, will be overridden by enrollment-based routing)
  }
  
  // Default para cualquier otro caso
  return '/mi-cuenta';
}

/**
 * Helper function para obtener la ruta por defecto para estudiantes basada en inscripciones
 * @param enrollmentCount Número de inscripciones del estudiante
 * @returns Ruta de destino
 */
export function getStudentRouteByEnrollments(enrollmentCount: number): string {
  return enrollmentCount > 0 ? '/mi-cuenta' : '/inscripcion';
}

/**
 * Maneja el éxito del login y determina la ruta de destino basada en inscripciones para estudiantes
 * @param router Router de Next.js
 * @param nextUrl URL de destino opcional
 * @returns Promise que resuelve cuando la redirección está completa
 */
export async function handleLoginSuccess(router: any, nextUrl?: string): Promise<void> {
  try {
    const user = getUser();
    
    // Si hay una URL de destino específica y es válida, usarla
    if (nextUrl) {
      const finalRedirect = getRedirectPath(nextUrl);
      if (finalRedirect !== '/mi-cuenta') { // Solo si no es la ruta por defecto
        router.replace(finalRedirect);
        return;
      }
    }
    
    // Para estudiantes (roleLevel 0), verificar inscripciones
    if (user?.roleLevel === 0) {
      const summary = await getCurrentUserEnrollmentsSummary();
      const studentRoute = getStudentRouteByEnrollments(summary.count);
      router.replace(studentRoute);
      return;
    }
    
    // Para staff, usar la lógica existente
    const defaultRoute = getDefaultRouteByRoleLevel(user?.roleLevel || 0);
    router.replace(defaultRoute);
  } catch (error) {
    console.error('Error in handleLoginSuccess:', error);
    // Fallback a la ruta por defecto
    router.replace('/mi-cuenta');
  }
}

/**
 * Helper function para obtener la ruta por defecto según un array de roles
 * Útil para casos donde ya tienes los roles disponibles
 * @deprecated Usar getDefaultRouteByRoleLevel cuando sea posible
 */
export function getDefaultRouteByRole(roles: string[]): string {
  // Prioridad: Nivel 3 (DevAdmin) > Nivel 2 (Admin) > Nivel 1 (Asistente) > Estudiante
  
  // Nivel 3: DevAdmin - Acceso completo al panel de administración
  if (roles.includes('DVADMIN') || roles.includes('MGADMIN') || roles.includes('AdminDev')) {
    return '/admin';
  }
  
  // Nivel 2: Admin - Dashboard
  if (roles.includes('ADMIN') || roles.includes('Admin')) {
    return '/dashboard';
  }
  
  // Nivel 1: Asistente - Dashboard
  if (roles.includes('ASISTENTE') || roles.includes('Asistente')) {
    return '/dashboard';
  }
  
  // Estudiante - Mi Cuenta
  return '/mi-cuenta';
}

/**
 * Guarda el token y datos del usuario después del login
 */
export function saveAuthData(token: string, expiresAt: string, user: User): void {
  if (typeof window === 'undefined') return;
  
  // Guardar en cookie (principal)
  setCookie(COOKIE_NAME, token, expiresAt);
  
  // Guardar en localStorage (backup para rehidratación)
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Obtiene el token JWT
 * Prioriza cookie, fallback a localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Intentar obtener de cookie primero
  const cookieToken = getCookie(COOKIE_NAME);
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fallback a localStorage
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Obtiene los datos del usuario guardados
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

/**
 * Verifica si el usuario está logueado
 * Comprueba la presencia de un token válido
 */
export function isLoggedIn(): boolean {
  const token = getToken();
  
  if (!token) {
    return false;
  }
  
  // Verificar si el token no ha expirado (básico)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp > now;
  } catch {
    // Si no se puede decodificar, asumir que es válido
    // El servidor validará la autenticidad
    return true;
  }
}

/**
 * Limpia la sesión eliminando token y datos del usuario
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  // Eliminar cookie
  deleteCookie(COOKIE_NAME);
  
  // Eliminar de localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('cd_user_roles');
  localStorage.removeItem('cd_user_id');
  localStorage.removeItem('cd_user_email');
}

/**
 * Verifica si el token está próximo a expirar (menos de 5 minutos)
 */
export function isTokenExpiringSoon(): boolean {
  const token = getToken();
  
  if (!token) {
    return true;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    return payload.exp - now < fiveMinutes;
  } catch {
    return false;
  }
}