import { api, apiClient, ApiError } from '@/lib/api';
import { toEnrollment, toEnrollments } from '@/lib/adapters';
import { extractErrorFromResponse, createNetworkError, createValidationError } from '@/lib/api-errors';
import { EnrollmentUI, ErrorUI, ServiceResponse, ListResponse } from '@/types/ui';

// DTOs del backend
export interface EnrollmentDTO {
  id: string;
  activityId: string;
  activityTitle: string;
  activityType: string;
  location?: string;
  startTime: string;
  endTime: string;
  seatNumber?: string;
  qrToken: string;
  enrolledAt: string;
  attended?: boolean;
  instructor?: string;
}

// Tipos de request
export interface CreateEnrollmentRequest {
  activityIds: string[];
}

export interface TimeConflictValidationRequest {
  activityIds: string[];
}

// Response types usando nueva estructura UI
export interface EnrollmentResponse extends ServiceResponse<EnrollmentUI> {}
export interface EnrollmentsListResponse extends ServiceResponse<ListResponse<EnrollmentUI>> {}
export interface EnrollmentsSummaryResponse extends ServiceResponse<{ count: number }> {}
export interface TimeConflictResponse extends ServiceResponse<{ hasConflicts: boolean; conflicts: string[]; message?: string }> {}

// Tipos legacy para compatibilidad
export interface UserEnrollment {
  id: string; // Changed to string (Guid)
  activityId: string; // Changed to string (Guid)
  activityTitle: string;
  activityKind: string;
  location: string;
  startTime: string;
  endTime: string;
  seatNumber?: string;
  qrToken: string; // QR token from backend
  enrolledAt: string;
  attended?: boolean;
  instructor?: string;
  // Legacy fields for backward compatibility
  status?: string;
  createdAt?: string;
  qrCodeId?: string; // Legacy field for backward compatibility
  activity?: {
    id: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
  };
}

export interface TimeConflictValidationResult {
  hasConflicts: boolean;
  conflicts: ConflictDetail[];
}

export interface ConflictDetail {
  selectedActivityId: number;
  selectedActivityTitle: string;
  conflictingActivityId: number;
  conflictingActivityTitle: string;
  overlapStart: string;
  overlapEnd: string;
}

// Validaciones
export const EnrollmentValidation = {
  validateActivityIds: (activityIds: string[]): string | null => {
    if (!Array.isArray(activityIds)) return 'Lista de actividades inválida';
    if (activityIds.length === 0) return 'Debe seleccionar al menos una actividad';
    if (activityIds.length > 10) return 'No puede inscribirse a más de 10 actividades';
    
    // Validar que todos los IDs sean strings válidos
    for (const id of activityIds) {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return 'ID de actividad inválido';
      }
    }
    
    // Validar que no haya duplicados
    const uniqueIds = new Set(activityIds);
    if (uniqueIds.size !== activityIds.length) {
      return 'No puede inscribirse a la misma actividad múltiples veces';
    }
    
    return null;
  },

  validateCreateRequest: (request: CreateEnrollmentRequest): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const activityIdsError = EnrollmentValidation.validateActivityIds(request.activityIds);
    if (activityIdsError) errors.activityIds = activityIdsError;
    
    return errors;
  }
};

// Servicio refactorizado
export class EnrollmentService {
  static async getUserEnrollments(userId: string): Promise<EnrollmentsListResponse> {
    try {
      if (!userId || typeof userId !== 'string') {
        return {
          success: false,
          error: createValidationError({ userId: 'ID de usuario requerido' })
        };
      }

      const rawData = await apiClient.get(`/users/${userId}/enrollments`);
      const enrollments = toEnrollments(Array.isArray(rawData) ? rawData : []);
      
      return {
        success: true,
        data: {
          items: enrollments,
          total: enrollments.length
        }
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

  static async getCurrentUserEnrollments(): Promise<EnrollmentsListResponse> {
    try {
      const rawData = await apiClient.get('/enrollments');
      const enrollments = toEnrollments(Array.isArray(rawData) ? rawData : []);
      
      return {
        success: true,
        data: {
          items: enrollments,
          total: enrollments.length
        }
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

  static async getCurrentUserEnrollmentsSummary(): Promise<EnrollmentsSummaryResponse> {
    try {
      const rawData = await apiClient.get('/enrollments/summary');
      const summary = rawData || { count: 0 };
      
      return {
        success: true,
        data: summary
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

  static async createEnrollment(request: CreateEnrollmentRequest): Promise<EnrollmentResponse> {
    try {
      // Validar datos
      const validationErrors = EnrollmentValidation.validateCreateRequest(request);
      if (Object.keys(validationErrors).length > 0) {
        return {
          success: false,
          error: createValidationError(validationErrors)
        };
      }

      const rawData = await apiClient.post('/enrollments', request);
      const enrollment = toEnrollment(rawData);
      
      return {
        success: true,
        data: enrollment
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

  static async deleteEnrollment(enrollmentId: string): Promise<ServiceResponse<void>> {
    try {
      if (!enrollmentId || typeof enrollmentId !== 'string') {
        return {
          success: false,
          error: createValidationError({ enrollmentId: 'ID de inscripción requerido' })
        };
      }

      await apiClient.del(`/enrollments/${enrollmentId}`);
      return {
        success: true
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

  static async validateTimeConflicts(request: TimeConflictValidationRequest): Promise<TimeConflictResponse> {
    try {
      const validationErrors = EnrollmentValidation.validateCreateRequest(request);
      if (Object.keys(validationErrors).length > 0) {
        return {
          success: false,
          error: createValidationError(validationErrors)
        };
      }

      if (request.activityIds.length < 2) {
        return {
          success: true,
          data: { hasConflicts: false, conflicts: [] }
        };
      }

      const rawData = await apiClient.post('/enrollments/validate-time-conflicts', { ActivityIds: request.activityIds });
      
      return {
        success: true,
        data: {
          hasConflicts: rawData.hasConflicts || false,
          conflicts: rawData.conflicts || [],
          message: rawData.message
        }
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
}

// Funciones legacy para compatibilidad (mantener para no romper código existente)

/**
 * Obtiene las inscripciones de un usuario específico (función legacy)
 * @param userId ID del usuario (string UUID)
 * @returns Promise con las inscripciones del usuario ([] en caso de error)
 */
export async function getUserEnrollments(userId: string): Promise<UserEnrollment[]> {
  try {
    const result = await api.get(`/users/${userId}/enrollments`);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error fetching user enrollments, returning empty array:', error);
    }
    return [];
  }
}

/**
 * Obtiene las inscripciones del usuario actual (desde el token) (función legacy)
 * @returns Promise con las inscripciones del usuario autenticado ([] en caso de error)
 */
export async function getCurrentUserEnrollments(): Promise<UserEnrollment[]> {
  try {
    const result = await api.get('/enrollments');
    return Array.isArray(result) ? result : [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error fetching current user enrollments, returning empty array:', error);
    }
    return [];
  }
}

/**
 * Obtiene el resumen de inscripciones del usuario actual (solo el conteo) (función legacy)
 * @returns Promise con el objeto { count: number }
 */
export async function getCurrentUserEnrollmentsSummary(): Promise<{ count: number }> {
  try {
    const result = await api.get('/enrollments/summary');
    return result || { count: 0 };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error fetching enrollments summary, returning default:', error);
    }
    return { count: 0 };
  }
}

/**
 * Valida conflictos de tiempo entre actividades seleccionadas y las inscripciones existentes del usuario (función legacy)
 * @param activityIds Array de IDs de actividades a validar (strings)
 * @returns Promise con el resultado de la validación
 */
export async function validateTimeConflictWithUserEnrollments(activityIds: string[]) {
  try {
    await api.post("/enrollments/validate-time-conflict", { activityIds });
    return { ok: true };
  } catch (e) {
    const err = e as ApiError;
    if (err.status === 409 || (err.status === 400 && /conflict|overlap|same time/i.test(err.message || ""))) {
      return { ok: false, reason: "conflict" };
    }
    throw err;
  }
}

/**
 * Crea una nueva inscripción (función legacy)
 * @param activityIds Array de IDs de actividades (strings)
 * @returns Promise con la inscripción creada
 */
export async function createEnrollment(activityIds: string[]) {
  return api.post("/enrollments", { activityIds });
}

/**
 * Elimina una inscripción (función legacy)
 * @param enrollmentId ID de la inscripción a eliminar
 * @returns Promise void
 */
export async function deleteEnrollment(enrollmentId: number): Promise<void> {
  return api.del(`/enrollments/${enrollmentId}`);
}