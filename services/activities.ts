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

export interface ActivityResponse extends ServiceResponse<ActivityUI> {}
export interface ActivitiesListResponse extends ServiceResponse<ListResponse<ActivityUI>> {}

export class ActivityService {
  static async getAll(): Promise<ActivitiesListResponse> {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ACTIVITIES.LIST);
      return res;
    } catch (error) {
      return { ok: false, data: { items: [], total: 0 }, error: { code: 'API_ERROR', message: 'Error al obtener actividades' } } as any;
    }
  }

  static async getById(id: string): Promise<ActivityResponse> {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ACTIVITIES.GET_BY_ID(id));
      return res;
    } catch (error) {
      return { ok: false, data: {} as any, error: { code: 'NOT_FOUND', message: 'Actividad no encontrada' } } as any;
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
  const res = await safeGet<any>(endpoint);
  if (res.success && Array.isArray(res.data)) {
    return res.data.map((a: any) => adaptActivity(a));
  }
  return [];
};

export async function fetchPublicActivities(): Promise<PublicActivity[]> {
  const res = await safeGet<any>(API_ENDPOINTS.ACTIVITIES.PUBLIC_LIST);
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
      return 'El tipo de actividad debe ser CHARLA, TALLER o COMPETENCIA';
    }
    return null;
  }

  static validateLocation(location: string): string | null {
    if (!location || location.trim().length === 0) {
      return 'La ubicación es requerida';
    }
    if (location.length < 2) {
      return 'La ubicación debe tener al menos 2 caracteres';
    }
    if (location.length > 100) {
      return 'La ubicación no puede exceder 100 caracteres';
    }
    return null;
  }

  static validateCapacity(capacity: number): string | null {
    if (!capacity || capacity <= 0) {
      return 'La capacidad debe ser mayor a 0';
    }
    if (capacity > 1000) {
      return 'La capacidad no puede exceder 1000 participantes';
    }
    return null;
  }

  static validateTimeRange(startTime: string, endTime: string): string | null {
    if (!startTime || !endTime) {
      return 'Los horarios de inicio y fin son requeridos';
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return 'La hora de fin debe ser posterior a la hora de inicio';
    }
    
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    if (duration < 30) {
      return 'La duración mínima es de 30 minutos';
    }
    
    if (duration > 480) { // 8 hours
      return 'La duración máxima es de 8 horas';
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
    if (activityIds.length < 2) {
      return { hasConflicts: false, conflicts: [] };
    }
    const data = await apiClient.post('/api/enrollments/validate-time-conflicts', { ActivityIds: activityIds }) as { hasConflicts: boolean; conflicts: string[]; message?: string; };
    return { hasConflicts: data.hasConflicts || false, conflicts: data.conflicts || [], message: data.message };
  } catch (error) {
    console.error('Error validating time conflicts:', error);
    return { hasConflicts: false, conflicts: [], message: 'Error al validar conflictos de tiempo' };
  }
}

export async function validateTimeConflictsEnhanced(activityIds: number[]): Promise<{ hasConflicts: boolean; conflicts: ConflictDetail[]; }> {
  try {
    const data = await apiClient.post('/api/enrollments/validate-time-conflicts', { ActivityIds: activityIds });
    return data;
  } catch (error) {
    console.error('Error validating time conflicts:', error);
    return { hasConflicts: false, conflicts: [] };
  }
}