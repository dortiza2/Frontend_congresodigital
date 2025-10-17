/**
 * Servicio para operaciones CRUD de usuarios con API real
 */

import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { APP_CONFIG } from '@/lib/appConfig';
import useSWR from 'swr';

// SWR fetcher function
const fetcher = (url: string) => apiClient.get(url);

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'MGADMIN' | 'ADMIN' | 'ASISTENTE';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: 'ADMIN' | 'ASISTENTE'; // Solo MGADMIN puede crear estos roles
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'ASISTENTE';
  status?: 'active' | 'inactive';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Servicio de usuarios para operaciones CRUD con API real
 */
export class UserService {
  /**
   * Obtener lista de usuarios con paginación y filtros
   */
  static async getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    status?: string
  ): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status })
      });

      const data = await apiClient.get(`${API_ENDPOINTS.USERS.LIST}?${params}`) as UserListResponse;
      return data;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const data = await apiClient.get(API_ENDPOINTS.USERS.GET_BY_ID(id)) as User;
      return data;
    } catch (error: any) {
      if (error.message?.includes('404')) return null;
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const data = await apiClient.post(API_ENDPOINTS.USERS.CREATE, userData) as User;
      return data;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Actualizar usuario existente
   */
  static async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const data = await apiClient.post(API_ENDPOINTS.USERS.UPDATE(id), userData) as User;
      return data;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Eliminar usuario (cambiar estado a inactivo)
   */
  static async deleteUser(id: string): Promise<boolean> {
    try {
      await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
      return true;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Reactivar usuario inactivo
   */
  static async reactivateUser(id: string): Promise<User> {
    try {
      const data = await apiClient.post(API_ENDPOINTS.USERS.UPDATE(id), { status: 'active' }) as User;
      return data;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Reset de contraseña de usuario
   */
  static async resetPassword(id: string, newPassword?: string): Promise<{ temporaryPassword: string }> {
    try {
      const data = await apiClient.post(
        API_ENDPOINTS.USERS.RESET_PASSWORD(id), 
        newPassword ? { password: newPassword } : {}
      ) as { temporaryPassword: string };
      return data;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    try {
      const data = await apiClient.get(API_ENDPOINTS.USERS.STATS) as {
        total: number;
        active: number;
        inactive: number;
        byRole: Record<string, number>;
      };
      return data;
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }
}

/**
 * Hook personalizado para usar el servicio de usuarios
 */
export function useUserService() {
  return {
    getUsers: UserService.getUsers,
    getUserById: UserService.getUserById,
    createUser: UserService.createUser,
    updateUser: UserService.updateUser,
    deleteUser: UserService.deleteUser,
    reactivateUser: UserService.reactivateUser,
    resetPassword: UserService.resetPassword,
    getUserStats: UserService.getUserStats
  };
}

/**
 * Utilidades de validación
 */
export const UserValidation = {
  /**
   * Validar formato de email
   */
  isValidEmail: (email: string): boolean => {
    return APP_CONFIG.VALIDATION.EMAIL_REGEX.test(email);
  },

  /**
   * Validar contraseña
   */
  isValidPassword: (password: string): boolean => {
    return password.length >= APP_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH;
  }
};

// SWR Hooks for user management
export const useUsers = (page = 1, pageSize = 10, filters?: {
  search?: string;
  role?: string;
  isActive?: boolean;
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.role && { role: filters.role }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive.toString() })
  });

  const { data, error, isLoading, mutate } = useSWR<UserListResponse>(
    `${API_ENDPOINTS.USERS.LIST}?${params}`,
    fetcher
  );

  return {
    users: data?.users || [],
    totalCount: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / pageSize),
    isLoading,
    error,
    mutate
  };
};

export const useUserStats = () => {
  const { data, error, isLoading, mutate } = useSWR<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }>(API_ENDPOINTS.USERS.STATS, fetcher);

  return {
    stats: data,
    isLoading,
    error,
    mutate
  };
};

// API functions with error handling and toast notifications
export const updateUserRole = async (userId: string, roleData: { role: 'ADMIN' | 'ASISTENTE' }): Promise<User> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(userId), roleData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar rol del usuario';
    throw new Error(message);
  }
};

export const updateUserStatus = async (userId: string, statusData: { status: 'active' | 'inactive' }): Promise<User> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(userId), statusData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar estado del usuario';
    throw new Error(message);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al eliminar usuario';
    throw new Error(message);
  }
};