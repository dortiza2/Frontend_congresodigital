import { api, apiClient, ApiError } from "@/lib/api";
import { toAuthUser } from '@/lib/adapters';
import { extractErrorFromResponse, createNetworkError, createValidationError } from '@/lib/api-errors';
import { AuthUserUI, ErrorUI, ServiceResponse } from '@/types/ui';

// Mantener funciones existentes para compatibilidad con código legacy
import { saveAuthData, getToken, clearSession, isLoggedIn, getUser } from '@/lib/authClient';
import { User } from '@/types/auth';

// DTOs del backend
export interface AuthUserDTO {
  id: string;
  email: string;
  fullName: string;
  isUmg: boolean;
  organizationName?: string;
  roleLevel: number;
  roles: string[];
}

export interface LoginDTO {
  token?: string;
  expiresAt?: string;
  user: AuthUserDTO;
}

export interface RegisterDTO {
  message: string;
  token?: string;
  expiresAt?: string;
  user: AuthUserDTO;
}

// Tipos de request
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
  institution?: string;
}

// Response types usando nueva estructura UI
export interface AuthResponse extends ServiceResponse<AuthUserUI> {}
export interface SessionResponse extends ServiceResponse<AuthUserUI> {}

// Tipos legacy para compatibilidad
export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    organization?: string;
    roles?: string[];
    roleLevel?: number;
  };
}

export interface LoginError {
  message: string;
}

export interface RegisterResponse {
  message: string;
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    isUmg: boolean;
    orgName: string;
    roles: string[];
    roleLevel: number;
  };
}

// Validaciones
export const AuthValidation = {
  validateEmail: (email: string): string | null => {
    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail) return 'El email es requerido';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return 'Formato de email inválido';
    
    return null;
  },

  validatePassword: (password: string): string | null => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  },

  validateFullName: (fullName: string): string | null => {
    if (!fullName?.trim()) return 'El nombre completo es requerido';
    if (fullName.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    return null;
  },

  validateLoginRequest: (request: LoginRequest): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const emailError = AuthValidation.validateEmail(request.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = AuthValidation.validatePassword(request.password);
    if (passwordError) errors.password = passwordError;
    
    return errors;
  },

  validateRegisterRequest: (request: RegisterRequest): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const emailError = AuthValidation.validateEmail(request.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = AuthValidation.validatePassword(request.password);
    if (passwordError) errors.password = passwordError;
    
    const nameError = AuthValidation.validateFullName(request.fullName);
    if (nameError) errors.fullName = nameError;
    
    return errors;
  }
};

// Servicio refactorizado
export class AuthService {
  static async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      // Validar datos
      const validationErrors = AuthValidation.validateLoginRequest(request);
      if (Object.keys(validationErrors).length > 0) {
        return {
          success: false,
          error: createValidationError(validationErrors)
        };
      }

      // Normalizar email
      const normalizedRequest = {
        ...request,
        email: request.email.trim().toLowerCase()
      };

      const rawData = await apiClient.post('/api/auth/login', normalizedRequest) as LoginDTO;
      const authUser = toAuthUser(rawData.user);
      
      return {
        success: true,
        data: authUser
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: extractErrorFromResponse(error.details, error.status)
        };
      }
      
      return {
        success: false,
        error: createNetworkError(error instanceof Error ? error : undefined)
      };
    }
  }

  static async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validar datos
      const validationErrors = AuthValidation.validateRegisterRequest(request);
      if (Object.keys(validationErrors).length > 0) {
        return {
          success: false,
          error: createValidationError(validationErrors)
        };
      }

      // Normalizar email
      const normalizedRequest = {
        fullName: request.fullName.trim(),
        email: request.email.trim().toLowerCase(),
        password: request.password,
        organization: request.institution?.trim()
      };

      const rawData = await apiClient.post('/api/auth/register', normalizedRequest) as RegisterDTO;
      const authUser = toAuthUser(rawData.user);
      
      return {
        success: true,
        data: authUser
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: extractErrorFromResponse(error.details, error.status)
        };
      }
      
      return {
        success: false,
        error: createNetworkError(error instanceof Error ? error : undefined)
      };
    }
  }

  static async getProfile(): Promise<SessionResponse> {
    try {
      const rawData = await apiClient.get('/api/auth/session') as AuthUserDTO;
      const authUser = toAuthUser(rawData);
      
      return {
        success: true,
        data: authUser
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: extractErrorFromResponse(error.details, error.status)
        };
      }
      
      return {
        success: false,
        error: createNetworkError(error instanceof Error ? error : undefined)
      };
    }
  }

  static logout(): ServiceResponse<void> {
    try {
      clearSession();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: createNetworkError(error instanceof Error ? error : undefined)
      };
    }
  }
}

// Servicio legacy para compatibilidad (mantener para no romper código existente)
export const authService = {
  register: (data: { fullName: string; email: string; password: string; organization?: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  session: () => api.get("/api/auth/session"),
};

/**
 * Realiza login con email y password (función legacy)
 * @param email Email del usuario
 * @param password Password del usuario
 * @returns Promise con la respuesta del login
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const data: LoginResponse = await authService.login({ email, password });
  
  // Crear objeto User completo con organización por defecto
  const userWithOrg: User = {
    ...data.user,
    organization: data.user.organization || 'Universidad Mariano Gálvez',
    name: data.user.name || '',
    roles: data.user.roles || []
  };
  
  // Guardar token, user data y roles en storage
  saveAuthData(data.token, data.expiresAt, userWithOrg);
  
  // Guardar roles específicamente para redirecciones
  if (typeof window !== 'undefined') {
    localStorage.setItem('cd_user_roles', JSON.stringify(userWithOrg.roles || []));
    localStorage.setItem('cd_user_id', userWithOrg.id);
    localStorage.setItem('cd_user_email', userWithOrg.email);
  }
  
  return data;
}

/**
 * Obtiene el token almacenado (cookie o localStorage)
 * @returns Token JWT o null si no existe
 */
export { getToken } from '@/lib/authClient';

/**
 * Obtiene los datos del usuario almacenados
 * @returns Datos del usuario o null si no existe
 */
export { getUser } from '@/lib/authClient';

/**
 * Verifica si el usuario está autenticado
 * @returns true si hay un token válido
 */
export { isLoggedIn as isAuthenticated } from '@/lib/authClient';

/**
 * Realiza logout eliminando el token y datos del usuario (función legacy)
 */
export function logout(): void {
  clearSession();
}

/**
 * Registra un nuevo usuario (función legacy)
 * @param data Datos del registro
 * @returns Promise con la respuesta del registro
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const result: RegisterResponse = await authService.register({
    fullName: data.fullName,
    email: data.email,
    password: data.password,
    organization: data.institution
  });
  
  // Crear objeto User completo para guardar en storage
  const userWithOrg: User = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.fullName,
    organization: result.user.orgName,
    roles: result.user.roles
  };
  
  // Guardar token, user data y roles en storage (login automático)
  saveAuthData(result.token, result.expiresAt, userWithOrg);
  
  // Guardar roles específicamente para redirecciones
  if (typeof window !== 'undefined') {
    localStorage.setItem('cd_user_roles', JSON.stringify(result.user.roles));
    localStorage.setItem('cd_user_id', result.user.id);
    localStorage.setItem('cd_user_email', result.user.email);
  }
  
  return result;
}