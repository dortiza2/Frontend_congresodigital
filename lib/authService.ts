// Servicio de autenticación con API real
import type { User, Activity, Enrollment, LoginResponse, EnrollmentResponse, AuthError } from '@/types/auth';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders, handleApiError, USE_MOCK_DATA } from './apiConfig';
import { ConfigUtils } from './appConfig';

// Datos de prueba para usuarios (solo para desarrollo)
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan.perez@umg.edu.gt',
    organization: 'Universidad Mariano Gálvez',
    roles: ['student'],
    roleLevel: 0,
    attended: false
  },
  {
    id: '2',
    name: 'DevAdmin User',
    email: 'devadmin@example.com',
    organization: 'Universidad Mariano Gálvez',
    roles: ['MGADMIN'],
    roleLevel: 3,
    attended: false
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    organization: 'Universidad Mariano Gálvez',
    roles: ['ADMIN'],
    roleLevel: 2,
    attended: false
  },
  {
    id: '4',
    name: 'Assistant User',
    email: 'asistente@example.com',
    organization: 'Universidad Mariano Gálvez',
    roles: ['ASISTENTE'],
    roleLevel: 1,
    attended: false
  },
  {
    id: '5',
    name: 'Demo User',
    email: 'demo.user@example.com',
    organization: 'Universidad Mariano Gálvez',
    roles: [],
    roleLevel: 0,
    attended: false
  },
  {
    id: '6',
    name: 'Carlos López',
    email: 'carlos.lopez@external.com',
    organization: 'Instituto Tecnológico',
    roles: ['external'],
    roleLevel: 0,
    attended: false
  }
];

// Simulación de delay de red (solo para modo mock)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Servicio de autenticación
export class AuthService {
  /**
   * Login con email y contraseña
   */
  static async loginEmail(email: string, password: string): Promise<User> {
    // Validaciones básicas
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Si estamos en modo mock, usar datos de prueba
    if (USE_MOCK_DATA) {
      await delay(800); // Simular delay de red
      
      // Buscar usuario por email
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Simular validación de contraseña (acepta cualquier contraseña en mock)
      if (password.length < 3) {
        throw new Error('Contraseña incorrecta');
      }
      
      // Guardar datos de sesión
      this.saveUserData(user);
      return user;
    }

    // Usar API real
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

      // Guardar token y datos de usuario
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

    // Validar dominio permitido usando configuración centralizada
    if (!ConfigUtils.isDomainAllowed(email)) {
      throw new Error('Dominio de email no permitido para registro');
    }

    // Si estamos en modo mock, usar datos de prueba
    if (USE_MOCK_DATA) {
      await delay(600);
      
      let user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        // Crear usuario automáticamente para Google OAuth
        user = {
          id: `google-${Date.now()}`,
          name: name || email.split('@')[0],
          email: email,
          organization: 'Universidad Mariano Gálvez',
          roles: ['student'],
          attended: false
        };
        mockUsers.push(user);
      }
      
      this.saveUserData(user);
      return user;
    }

    // Usar API real para Google OAuth
    try {
      const response = await fetch(buildApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          email, 
          name: name || email.split('@')[0],
          picture 
        })
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

      // Guardar token y datos de usuario
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
    // Si estamos usando API real, notificar al servidor
    if (!USE_MOCK_DATA) {
      try {
        await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
          method: 'POST',
          headers: getAuthHeaders()
        });
      } catch (error) {
        // Ignorar errores de logout del servidor
        console.warn('Error al cerrar sesión en el servidor:', error);
      }
    }

    // Limpiar datos locales
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
  }

  /**
   * Obtener usuario actual
   */
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Guardar datos del usuario en localStorage
   */
  static saveUserData(user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
    if (USE_MOCK_DATA) {
      localStorage.setItem('auth_token', `mock_token_${user.id}`);
    }
  }
}