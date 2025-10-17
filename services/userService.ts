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
      throw new Error(error?.details?.message ?? error?.message ?? 'Error desconocido');
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const data = await apiClient.get(API_ENDPOINTS.USERS.GET_BY_ID(id)) as User;
      return data || null;
    } catch (error: any) {
      if (APP_CONFIG.DEV.ENABLE_DEBUG_LOGS) console.warn('Error getting user by id', error);
      return null;
    }
  }

  /**
   * Crear usuario
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const data = await apiClient.post(API_ENDPOINTS.USERS.CREATE, userData) as User;
      return data;
    } catch (error: any) {
      throw new Error(error?.details?.message ?? error?.message ?? 'Error desconocido');
    }
  }

  /**
   * Actualizar usuario
   */
  static async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const data = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), userData) as User;
      return data;
    } catch (error: any) {
      throw new Error(error?.details?.message ?? error?.message ?? 'Error desconocido');
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
      throw new Error(error?.details?.message ?? error?.message ?? 'Error desconocido');
    }
  }

  /**
   * Reactivar usuario
   */
  static async reactivateUser(id: string): Promise<User> {
    try {
      const data = await apiClient.post(API_ENDPOINTS.USERS.UPDATE(id), { status: 'active' }) as User;
      return data;
    } catch (error: any) {
      throw new Error(error?.details?.message ?? error?.message ?? 'Error desconocido');
    }
  }

  /**
   * Resetear contraseña de usuario
   */
  static async resetPassword(id: string, newPassword?: string): Promise<{ temporaryPassword: string }> {
    try {
      const data = await apiClient.post(API_ENDPOINTS.USERS.RESET_PASSWORD(id), { newPassword }) as { temporaryPassword: string };
      return data;
    } catch (error: any) {
      throw new Error(error?.details?.message ?? error?.message ?? 'Error desconocido');
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
      throw new Error(error?.details?.message ?? error?.message ?? 'Error desconocido');
    }
  }
}

export function useUserService() {
  return {
    getUsers: UserService.getUsers,
    getUserById: UserService.getUserById,
    createUser: UserService.createUser,
    updateUser: UserService.updateUser,
    deleteUser: UserService.deleteUser,
    reactivateUser: UserService.reactivateUser,
    getUserStats: UserService.getUserStats,
  };
}

export const UserValidation = {
  isValidName: (name: string): boolean => {
    return typeof name === 'string' && name.trim().length >= 2;
  },

  isValidEmail: (email: string): boolean => {
    return /.+@.+\..+/.test(email);
  },

  isValidPassword: (password: string): boolean => {
    return typeof password === 'string' && password.length >= 6;
  },
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

  const total = data?.total ?? 0;
  const users = data?.users ?? [];
  const totalPages = Math.ceil(total / (pageSize || 1));

  return {
    users,
    total,
    totalPages,
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
    return response;
  } catch (error: any) {
    const message = (error?.details?.message ?? error?.message) || 'Error al actualizar rol del usuario';
    throw new Error(message);
  }
};

export const updateUserStatus = async (userId: string, statusData: { status: 'active' | 'inactive' }): Promise<User> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(userId), statusData);
    return response;
  } catch (error: any) {
    const message = (error?.details?.message ?? error?.message) || 'Error al actualizar estado del usuario';
    throw new Error(message);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
  } catch (error: any) {
    const message = (error?.details?.message ?? error?.message) || 'Error al eliminar usuario';
    throw new Error(message);
  }
};