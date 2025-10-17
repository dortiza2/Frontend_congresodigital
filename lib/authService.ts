// Servicio de autenticación con API real
import type { User, Activity, Enrollment, LoginResponse, EnrollmentResponse, AuthError } from '@/types/auth';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders, handleApiError } from './apiConfig';
import { ConfigUtils } from './appConfig';

// Servicio de autenticación
export class AuthService {
  /**
   * Login con email y contraseña
   */
  static async loginEmail(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Formato de email inválido');
    }

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error de autenticación');
      }
      const data = await response.json();
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        organization: data.user.organization || 'Universidad Mariano Gálvez',
        roles: data.user.roles || [],
        attended: data.user.attended || false
      };
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      this.saveUserData(user);
      return user;
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Login con Google OAuth
   */
  static async loginGoogle(email: string, name?: string, picture?: string): Promise<User> {
    if (!email) {
      throw new Error('Email es requerido');
    }
    if (!ConfigUtils.isDomainAllowed(email)) {
      throw new Error('Dominio de email no permitido para registro');
    }
    try {
      const response = await fetch(buildApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, name: name || email.split('@')[0], picture })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error de autenticación con Google');
      }
      const data = await response.json();
      const user: User = {
        id: data.user.id,
        name: data.user.fullName || data.user.name,
        email: data.user.email,
        organization: data.user.orgName || 'Universidad Mariano Gálvez',
        roles: data.user.roles || ['student'],
        attended: false
      };
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        if (data.expiresAt) {
          localStorage.setItem('token_expires_at', data.expiresAt);
        }
      }
      this.saveUserData(user);
      return user;
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout(): Promise<void> {
    try {
      await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), { method: 'POST', headers: getAuthHeaders() });
    } catch (_) {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('cd_user');
  }

  static isAuthenticated(): boolean {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return !!token;
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('cd_user');
    try {
      return userStr ? JSON.parse(userStr) as User : null;
    } catch {
      return null;
    }
  }

  static saveUserData(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cd_user', JSON.stringify(user));
  }
}