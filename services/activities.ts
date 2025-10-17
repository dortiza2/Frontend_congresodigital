import { api, apiClient, ApiError, safeGet } from '@/lib/api';
import { adaptActivity, type PublicActivity } from '@/lib/adapters/activity';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { useState, useCallback } from 'react';
import { ConflictDetail } from './enrollments';
import { ActivityUI, ServiceResponse, ListResponse } from '@/types/ui';

export type { PublicActivity };

// DTOs backend
export interface Activity {
  id: string;
  title: string;
  description?: string;
  activityType: 'CHARLA' | 'TALLER' | 'COMPETENCIA';
  location?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  published: boolean;
  isActive: boolean;
  requiresEnrollment: boolean;
  enrolledCount?: number;
  availableSpots?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  title: string;
  description?: string;
  activityType: string;
  location?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive?: boolean;
  requiresEnrollment?: boolean;
}

export interface UpdateActivityRequest {
  title?: string;
  description?: string;
  activityType?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  isActive?: boolean;
  requiresEnrollment?: boolean;
  published?: boolean;
}

// Alinear respuestas a DTO (no ActivityUI) para páginas admin
export interface ActivityResponse extends ServiceResponse<Activity> {}
export interface ActivitiesListResponse extends ServiceResponse<ListResponse<Activity>> {}

export class ActivityService {
  static async getAll(): Promise<ActivitiesListResponse> {
    try {
      const raw = await apiClient.get(API_ENDPOINTS.ACTIVITIES.LIST);
      // Normalizar distintas formas de respuesta a ServiceResponse<ListResponse<Activity>>
      if (Array.isArray(raw)) {
        return { success: true, data: { items: raw, total: raw.length, hasMore: false } } as ActivitiesListResponse;
      }
      if (raw?.items && Array.isArray(raw.items)) {
        return { success: true, data: { items: raw.items, total: raw.total ?? raw.items.length, hasMore: raw.hasMore ?? false } } as ActivitiesListResponse;
      }
      if (raw?.data?.items && Array.isArray(raw.data.items)) {
        // Ya está envuelto como ServiceResponse
        return raw as ActivitiesListResponse;
      }
      if (raw?.data && Array.isArray(raw.data)) {
        return { success: true, data: { items: raw.data, total: raw.data.length, hasMore: false } } as ActivitiesListResponse;
      }
      // Fallback: intentar mapear si llegó un objeto de actividad simple
      const items = raw && typeof raw === 'object' ? [raw] : [];
      return { success: true, data: { items, total: items.length, hasMore: false } } as ActivitiesListResponse;
    } catch (error) {
      const fallback: ActivitiesListResponse = {
        success: false,
        fromFallback: true,
        data: { items: [], total: 0, hasMore: false },
        error: { code: 'API_ERROR', message: 'Error al obtener actividades', severity: 'error' }
      };
      return fallback;
    }
  }

  static async getById(id: string): Promise<ActivityResponse> {
    try {
      const raw = await apiClient.get(API_ENDPOINTS.ACTIVITIES.GET_BY_ID(id));
      if (raw?.data) {
        return raw as ActivityResponse;
      }
      return { success: true, data: raw } as ActivityResponse;
    } catch (error) {
      const fallback: ActivityResponse = {
        success: false,
        fromFallback: true,
        error: { code: 'NOT_FOUND', message: 'Actividad no encontrada', severity: 'error' }
      };
      return fallback;
    }
  }

  static async create(request: CreateActivityRequest): Promise<ActivityResponse> {
    const res = await apiClient.post(API_ENDPOINTS.ACTIVITIES.CREATE, request);
    return res;
  }

  static async update(id: string, request: UpdateActivityRequest): Promise<ActivityResponse> {
    const res = await apiClient.put(API_ENDPOINTS.ACTIVITIES.UPDATE(id), request);
    return res;
  }

  static async delete(id: string): Promise<ServiceResponse<void>> {
    const res = await apiClient.del(API_ENDPOINTS.ACTIVITIES.DELETE(id));
    return res;
  }

  static async publish(id: string): Promise<ActivityResponse> {
    const res = await apiClient.post(API_ENDPOINTS.ACTIVITIES.PUBLISH(id));
    return res;
  }

  static async unpublish(id: string): Promise<ActivityResponse> {
    const res = await apiClient.post(API_ENDPOINTS.ACTIVITIES.UNPUBLISH(id));
    return res;
  }
}

export function useActivityService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exec = useCallback(async <T>(fn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      setError(e?.message || 'Error de operación');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAll: () => exec(ActivityService.getAll),
    getById: (id: string) => exec(() => ActivityService.getById(id)),
    create: (req: CreateActivityRequest) => exec(() => ActivityService.create(req)),
    update: (id: string, req: UpdateActivityRequest) => exec(() => ActivityService.update(id, req)),
    remove: (id: string) => exec(() => ActivityService.delete(id)),
    publish: (id: string) => exec(() => ActivityService.publish(id)),
    unpublish: (id: string) => exec(() => ActivityService.unpublish(id)),
    clearError: () => setError(null)
  };
}

// Público: obtener actividades sin fallback a JSON local
export const getActivities = async (kinds?: string): Promise<PublicActivity[]> => {
  const endpoint = kinds ? `${API_ENDPOINTS.ACTIVITIES.PUBLIC_LIST}?type=${kinds}` : API_ENDPOINTS.ACTIVITIES.PUBLIC_LIST;
  const res = await safeGet<any[]>(endpoint);
  if (res.success && Array.isArray(res.data)) {
    return res.data.map((a: any) => adaptActivity(a));
  }
  return [];
};

export async function fetchPublicActivities(): Promise<PublicActivity[]> {
  const res = await safeGet<any[]>(API_ENDPOINTS.ACTIVITIES.PUBLIC_LIST);
  if (res.success && Array.isArray(res.data)) {
    return res.data.map((a: any) => adaptActivity(a));
  }
  return [];
}

// Validación de actividades
export class ActivityValidation {
  static validateTitle(title: string): string | null {
    if (!title || title.trim().length === 0) {
      return 'El título es requerido';
    }
    if (title.length < 3) {
      return 'El título debe tener al menos 3 caracteres';
    }
    if (title.length > 200) {
      return 'El título no puede exceder 200 caracteres';
    }
    return null;
  }

  static validateDescription(description: string): string | null {
    if (!description || description.trim().length === 0) {
      return 'La descripción es requerida';
    }
    if (description.length < 10) {
      return 'La descripción debe tener al menos 10 caracteres';
    }
    if (description.length > 1000) {
      return 'La descripción no puede exceder 1000 caracteres';
    }
    return null;
  }

  static validateActivityType(activityType: string): string | null {
    const validTypes = ['CHARLA', 'TALLER', 'COMPETENCIA'];
    if (!validTypes.includes(activityType)) {
      return 'Tipo de actividad inválido';
    }
    return null;
  }

  static validateLocation(location: string): string | null {
    if (!location || location.trim().length === 0) {
      return 'La ubicación es requerida';
    }
    return null;
  }

  static validateCapacity(capacity: number): string | null {
    if (capacity <= 0) {
      return 'La capacidad debe ser mayor a 0';
    }
    if (capacity > 1000) {
      return 'La capacidad no puede exceder 1000';
    }
    return null;
  }

  static validateTimeRange(startTime: string, endTime: string): string | null {
    if (!startTime || !endTime) {
      return 'La hora de inicio y fin son requeridas';
    }
    if (new Date(endTime) <= new Date(startTime)) {
      return 'La hora de fin debe ser posterior a la de inicio';
    }
    return null;
  }
}

export function filterActivitiesByKind(activities: PublicActivity[], kind: string | 'all'): PublicActivity[] {
  if (kind === 'all') return activities;
  return activities.filter(a => a.kind.toLowerCase() === kind.toLowerCase());
}

export function isActivityAvailable(activity: PublicActivity): boolean {
  return activity.published && !activity.isFull;
}

export async function validateTimeConflicts(activityIds: string[]): Promise<{ hasConflicts: boolean; conflicts: string[]; message?: string; }> {
  try {
    const res = await apiClient.post('/enrollments/validate-time-conflicts', { ActivityIds: activityIds });
    return { hasConflicts: !!res?.hasConflicts, conflicts: Array.isArray(res?.conflicts) ? res.conflicts : [], message: res?.message };
  } catch (error: any) {
    return { hasConflicts: false, conflicts: [], message: error?.message ?? 'No se pudo validar conflictos' };
  }
}

export async function validateTimeConflictsEnhanced(activityIds: number[]): Promise<{ hasConflicts: boolean; conflicts: ConflictDetail[]; message?: string; }> {
  try {
    const res = await apiClient.post('/enrollments/validate-time-conflicts', { ActivityIds: activityIds });
    return { hasConflicts: !!res?.hasConflicts, conflicts: Array.isArray(res?.conflicts) ? res.conflicts : [], message: res?.message };
  } catch (error) {
    return { hasConflicts: false, conflicts: [], message: 'No se pudo validar conflictos' };
  }
}