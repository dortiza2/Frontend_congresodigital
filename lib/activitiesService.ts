// Servicio de actividades con API real
import type { Activity, Enrollment, EnrollmentResponse } from '../types/auth';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders, handleApiError } from './apiConfig';

export class ActivitiesService {
  /**
   * Obtener lista de actividades
   */
  static async listActivities(): Promise<Activity[]> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ACTIVITIES.LIST), {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Error al obtener actividades');
      }
      return await response.json();
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtener actividad por ID
   */
  static async getActivity(id: string): Promise<Activity | null> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ACTIVITIES.GET_BY_ID(id)), {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Error al obtener actividad');
      }
      return await response.json();
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Inscribirse a múltiples actividades
   */
  static async enrollMany(userId: string, activityIds: string[]): Promise<EnrollmentResponse> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ACTIVITIES.ENROLL), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, activityIds })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al inscribirse');
      }
      return await response.json();
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Obtener inscripciones de un usuario
   */
  static async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ENROLLMENTS.BY_USER(userId)), {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Error al obtener inscripciones');
      }
      return await response.json();
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Enviar email de confirmación
   */
  static async sendEnrollmentEmail(to: string, enrollments: Enrollment[]): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl('/api/email/enrollment'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ to, enrollments })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Marcar asistencia por código QR
   */
  static async markAttendance(qrCodeId: string): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ENROLLMENTS.MARK_ATTENDANCE_BY_QR), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ qrCodeId })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al marcar asistencia');
      }
      return true;
    } catch (error: any) {
      throw new Error(handleApiError(error));
    }
  }
}