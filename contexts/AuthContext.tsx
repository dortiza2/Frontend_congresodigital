'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as authLogin } from '@/services/auth';
import { getUser, isLoggedIn, getUserRoles, clearSession, getToken } from '@/lib/authClient';
import type { User, AuthContextType } from '@/types/auth';
import { useRouter } from 'next/router';
import { apiClient } from '@/lib/api';

// Helper para validar dominios permitidos
const isAllowedDomain = (email: string): boolean => {
  const allowedDomains = ['umg.edu.gt', 'miumg.edu.gt'];
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props del provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider del contexto de autenticación
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verificar sesión al montar el componente
  useEffect(() => {
    checkAuth();
    
    // Configurar revalidación cada 5 minutos
    const interval = setInterval(() => {
      if (isLoggedIn()) {
        revalidateToken();
      }
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, []);

  // Función para revalidar token con el servidor
  const revalidateToken = async () => {
    try {
      const token = getToken();
      if (!token) {
        clearSession();
        setUser(null);
        return;
      }
      
      try {
        const userData = await apiClient.get('/api/auth/me') as User;
        setUser(userData);
      } catch (error) {
        // Token inválido, limpiar sesión pero no redirigir automáticamente
        console.warn('Token inválido durante revalidación');
        clearSession();
        setUser(null);
        return;
      }
    } catch (error) {
      console.error('Error revalidating token:', error);
      // En caso de error de red, mantener sesión local y no hacer nada agresivo
    }
  };

  // Función para verificar autenticación (JWT-first)
  const checkAuth = async () => {
    try {
      setLoading(true);
      console.log('[AuthContext] Verificando autenticación...');
      
      // PRIORIZAR JWT: verificar primero si hay JWT válido
      const loggedIn = isLoggedIn();
      console.log('[AuthContext] isLoggedIn():', loggedIn);
      
      if (loggedIn) {
        const token = getToken();
        console.log('[AuthContext] Token encontrado:', !!token);
        
        if (token) {
          try {
            // Intentar obtener datos del usuario desde el servidor
            console.log('[AuthContext] Intentando obtener datos del servidor...');
            const userData = await apiClient.get('/api/auth/me') as User;
            console.log('[AuthContext] Datos del usuario obtenidos del servidor:', userData);
            setUser(userData);
            return;
          } catch (error) {
            console.error('Error fetching user data from server:', error);
          }
          
          // Fallback: usar datos locales si el servidor no responde
          console.log('[AuthContext] Usando fallback de datos locales...');
          const userData = getUser();
          console.log('[AuthContext] Datos locales del usuario:', userData);
          
          if (userData) {
            const roles = getUserRoles();
            console.log('[AuthContext] Roles del usuario:', roles);
            
            const userWithRoles: User = { 
              ...userData, 
              roles,
              roleLevel: userData.roleLevel || 0, // Default a student
              name: userData.name || userData.fullName || '',
              fullName: userData.fullName || userData.name || '',
              organization: userData.organization,
              profileType: userData.profileType || 'student',
              staffRole: userData.staffRole,
              isUmg: userData.isUmg ?? (userData.email ? isAllowedDomain(userData.email) : false)
            };
            console.log('[AuthContext] Usuario final con roles:', userWithRoles);
            setUser(userWithRoles);
            return;
          }
        }
      }
      
      // No hay sesión válida
      setUser(null);
    } catch (error) {
      console.error('Error checking authentication:', error);
      // Limpiar datos corruptos
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login con email y contraseña
  const loginEmail = async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      const response = await authLogin(email, password);
      
      // El servicio auth ya guarda los datos, solo necesitamos actualizar el estado
      const userWithRoles: User = {
        ...response.user,
        name: response.user.name || '',
        organization: response.user.organization || 'Universidad Mariano Gálvez',
        roles: response.user.roles || [],
        roleLevel: response.user.roleLevel || 0 // Default a student
      };
      
      setUser(userWithRoles);
      return userWithRoles;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login con Google (solo correos @umg.edu.gt)
  const loginGoogle = async (email: string): Promise<User> => {
    try {
      setLoading(true);
      
      // Validar dominio antes de proceder
      if (!isAllowedDomain(email)) {
        throw new Error('Solo se permiten correos institucionales @umg.edu.gt o @miumg.edu.gt');
      }
      
      // Para Google login, crear usuario con roles desde JWT si existe
      const userWithRoles: User = {
        id: Date.now().toString(),
        name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email,
        organization: 'Universidad Mariano Gálvez',
        roles: ['student'], // Por defecto, estudiante para correos UMG
        roleLevel: 3 // Student level por defecto
      };
      
      // Guardar en localStorage para compatibilidad
      if (typeof window !== 'undefined') {
        localStorage.setItem('cd_user_roles', JSON.stringify(userWithRoles.roles));
        localStorage.setItem('cd_user_id', userWithRoles.id);
        localStorage.setItem('cd_user_email', userWithRoles.email);
      }
      
      setUser(userWithRoles);
      
      return userWithRoles;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      
      // Llamar al endpoint de logout del backend .NET
      try {
        await apiClient.post('/api/auth/logout');
      } catch (error) {
        console.warn('Error calling backend logout:', error);
        // Continuar con logout local aunque falle el servidor
      }
      
      // Limpiar sesión local
      clearSession();
      setUser(null);
      
      // Siempre redirigir a la página principal
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar logout local aunque falle el servidor
      clearSession();
      setUser(null);
      
      // Redirigir incluso si hay error
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar datos del usuario
  const refreshUser = async () => {
    await revalidateToken();
  };

  const value: AuthContextType = {
    user,
    loading,
    loginEmail,
    loginGoogle,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
}

// Hook para verificar si el usuario está autenticado
export function useRequireAuth(): User {
  const { user, loading } = useAuth();
  
  if (loading) {
    throw new Error('Cargando autenticación...');
  }
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  return user;
}

// Hook para verificar roles específicos
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  return user?.roles?.includes(role) ?? false;
}

// Hook para verificar si es estudiante institucional (UMG o MIUMG)
export function useIsInstitutionalStudent(): boolean {
  const { user } = useAuth();
  return user?.email ? isAllowedDomain(user.email) : false;
}

// Mantener compatibilidad con el hook anterior
export function useIsUMGStudent(): boolean {
  return useIsInstitutionalStudent();
}