// Servicio de actividades con API real
import type { Activity, Enrollment, EnrollmentResponse } from '../types/auth';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders, handleApiError, USE_MOCK_DATA } from './apiConfig';

// Datos de prueba para actividades (solo para desarrollo)
const mockActivities: Activity[] = [
  {
    id: 'act-1',
    title: 'Introducción a React y Next.js',
    kind: 'taller',
    location: 'Aula 101',
    startTime: '2025-03-15T09:00:00.000Z',
    endTime: '2025-03-15T11:00:00.000Z',
    capacity: 30,
    enrolled: 12,
    description: 'Aprende los fundamentos de React y Next.js para desarrollo web moderno',
    instructor: 'Dr. Ana Martínez',
    requirements: ['Conocimientos básicos de JavaScript', 'Laptop con Node.js instalado']
  },
  {
    id: 'act-2',
    title: 'Desarrollo de APIs con Node.js',
    kind: 'taller',
    location: 'Aula 102',
    startTime: '2025-03-15T14:00:00.000Z',
    endTime: '2025-03-15T16:00:00.000Z',
    capacity: 25,
    enrolled: 8,
    description: 'Construye APIs RESTful robustas usando Node.js y Express',
    instructor: 'Ing. Carlos Rodríguez',
    requirements: ['Conocimientos de JavaScript', 'Experiencia básica con bases de datos']
  },
  {
    id: 'act-3',
    title: 'Competencia de Programación',
    kind: 'competencia',
    location: 'Laboratorio de Cómputo',
    startTime: '2025-03-16T10:00:00.000Z',
    endTime: '2025-03-16T13:00:00.000Z',
    capacity: 50,
    enrolled: 23,
    description: 'Resuelve problemas algorítmicos en tiempo real',
    instructor: 'Comité Organizador',
    requirements: ['Conocimientos de algoritmos', 'Laptop con IDE configurado']
  },
  {
    id: 'act-4',
    title: 'Machine Learning con Python',
    kind: 'taller',
    location: 'Aula 201',
    startTime: '2025-03-16T09:00:00.000Z',
    endTime: '2025-03-16T12:00:00.000Z',
    capacity: 20,
    enrolled: 15,
    description: 'Introducción práctica al aprendizaje automático',
    instructor: 'Dra. Laura Fernández',
    requirements: ['Python básico', 'Conceptos de estadística']
  },
  {
    id: 'act-5',
    title: 'Conferencia: El Futuro de la IA',
    kind: 'conferencia',
    location: 'Auditorio Principal',
    startTime: '2025-03-17T16:00:00.000Z',
    endTime: '2025-03-17T17:30:00.000Z',
    capacity: 200,
    enrolled: 87,
    description: 'Perspectivas sobre el impacto de la inteligencia artificial',
    instructor: 'Dr. Roberto Silva',
    requirements: []
  }
];

// Simulación de inscripciones (solo para modo mock)
const mockEnrollments: Enrollment[] = [];

// Simulación de delay de red (solo para modo mock)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generar ID único
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Generar número de asiento
const generateSeatNumber = (activityId: string) => {
  const activity = mockActivities.find(a => a.id === activityId);
  if (!activity) return 'N/A';
  
  const enrolledCount = mockEnrollments.filter(e => e.activityId === activityId).length;
  return `${activity.location}-${String(enrolledCount + 1).padStart(3, '0')}`;
};

// Generar código QR
const generateQRCode = () => `QR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

export class ActivitiesService {
  /**
   * Obtener lista de actividades
   */
  static async listActivities(): Promise<Activity[]> {
    if (USE_MOCK_DATA) {
      await delay(300);
      return [...mockActivities];
    }

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
    if (USE_MOCK_DATA) {
      await delay(200);
      return mockActivities.find(a => a.id === id) || null;
    }

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
    if (USE_MOCK_DATA) {
      await delay(1000);

      // Validar que las actividades existan
      const invalidIds = activityIds.filter(id => !mockActivities.find(a => a.id === id));
      if (invalidIds.length > 0) {
        throw new Error(`Actividades no encontradas: ${invalidIds.join(', ')}`);
      }

      // Verificar conflictos de horario
      const conflicts = this.checkTimeConflicts(activityIds);
      if (conflicts.length > 0) {
        throw new Error(`Conflictos de horario detectados: ${conflicts.join(', ')}`);
      }

      // Verificar capacidad
      for (const activityId of activityIds) {
        const activity = mockActivities.find(a => a.id === activityId);
        if (activity && activity.enrolled >= activity.capacity) {
          throw new Error(`La actividad "${activity.title}" está llena`);
        }
      }

      // Crear inscripciones
      const enrollments: Enrollment[] = activityIds.map(activityId => ({
        id: generateId(),
        userId,
        activityId,
        enrolledAt: new Date(), // Cambiar a Date en lugar de string
        seatNumber: generateSeatNumber(activityId),
        qrCodeId: generateQRCode(),
        attended: false
      }));

      // Agregar a la lista mock
      mockEnrollments.push(...enrollments);

      // Actualizar contador de inscritos
      enrollments.forEach(enrollment => {
        const activity = mockActivities.find(a => a.id === enrollment.activityId);
        if (activity) {
          activity.enrolled++;
        }
      });

      return {
        success: true,
        enrollments,
        message: `Inscripción exitosa a ${enrollments.length} actividad(es)`
      };
    }

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
    if (USE_MOCK_DATA) {
      await delay(400);
      return mockEnrollments.filter(e => e.userId === userId);
    }

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
   * Enviar email de confirmación (simulado)
   */
  static async sendEnrollmentEmail(to: string, enrollments: Enrollment[]): Promise<boolean> {
    if (USE_MOCK_DATA) {
      await delay(800);
      console.log(`Email enviado a ${to} con ${enrollments.length} inscripciones`);
      return true;
    }

    // En producción, esto sería una llamada real a la API de email
    try {
      const response = await fetch(buildApiUrl('/api/email/enrollment'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ to, enrollments })
      });

      return response.ok;
    } catch (error) {
      console.warn('Error al enviar email:', error);
      return false;
    }
  }

  /**
   * Marcar asistencia por código QR
   */
  static async markAttendance(qrCodeId: string): Promise<boolean> {
    if (USE_MOCK_DATA) {
      await delay(500);
      const enrollment = mockEnrollments.find(e => e.qrCodeId === qrCodeId);
      
      if (!enrollment) {
        throw new Error('Código QR no válido');
      }
      
      enrollment.attended = true;
      enrollment.attendedAt = new Date().toISOString();
      return true;
    }

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

  /**
   * Verificar conflictos de horario entre actividades
   */
  static checkTimeConflicts(activityIds: string[]): string[] {
    const activities = mockActivities.filter(a => activityIds.includes(a.id));
    const conflicts: string[] = [];

    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const a1 = activities[i];
        const a2 = activities[j];
        
        const start1 = new Date(a1.startTime);
        const end1 = new Date(a1.endTime);
        const start2 = new Date(a2.startTime);
        const end2 = new Date(a2.endTime);
        
        // Verificar si hay solapamiento
        if (start1 < end2 && start2 < end1) {
          conflicts.push(`${a1.title} y ${a2.title}`);
        }
      }
    }

    return conflicts;
  }
}