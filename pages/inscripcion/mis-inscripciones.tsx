import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isLoggedIn, getUser } from '@/lib/authClient';
import { apiClient, ApiError } from '@/lib/api';
import { getCurrentUserEnrollments, deleteEnrollment, UserEnrollment as ServiceEnrollment } from '@/services/enrollments';
import Logo from '@/components/Logo';
import { Calendar, Clock, MapPin, Users, ArrowLeft, AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { EnrollmentsStateWrapper } from '@/components/ui/ui-state-wrapper';
import { useUIState } from '@/hooks/useUIState';
import { useToast } from '@/hooks/useToast';
import { getUserFriendlyErrorMessage } from '@/lib/errorHandler';
import { formatGT, formatGTTime } from '@/lib/datetime';

interface PageEnrollment {
  id: string;
  activityId: string;
  activityTitle: string;
  activityStartTime: string;
  activityEndTime: string;
  activityLocation: string;
  organizationName: string;
  enrolledAt: string;
}

// Función para mapear datos del servicio al formato de la página
function mapServiceEnrollment(serviceEnrollment: ServiceEnrollment): PageEnrollment {
  return {
    id: serviceEnrollment.id,
    activityId: serviceEnrollment.activityId,
    activityTitle: serviceEnrollment.activityTitle,
    activityStartTime: serviceEnrollment.startTime,
    activityEndTime: serviceEnrollment.endTime,
    activityLocation: serviceEnrollment.location,
    organizationName: 'UMG', // Default organization
    enrolledAt: serviceEnrollment.enrolledAt,
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function MisInscripcionesPage() {
  const router = useRouter();
  const uiState = useUIState<PageEnrollment[]>();
  const { showError, showSuccess } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Verificar autenticación al cargar
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/inscripcion?next=/inscripcion/mis-inscripciones');
      return;
    }

    const userData = getUser();
    if (userData) {
      setUser(userData);
      loadEnrollments();
    } else {
      console.error('Invalid user data:', userData);
      uiState.setError('No hay sesión activa');
    }
  }, [router]);

  // Cargar inscripciones del usuario
  const loadEnrollments = async () => {
    try {
      uiState.setLoading();
      
      const data = await getCurrentUserEnrollments();
      const mappedData = (data || []).map(mapServiceEnrollment);
      uiState.setSuccess(mappedData);
    } catch (err: any) {
      console.error('Error loading enrollments:', err);
      if (err instanceof ApiError && err.status === 401) {
        // Token expirado, redirigir al login
        router.replace('/inscripcion?next=/inscripcion/mis-inscripciones');
        return;
      }
      
      const errorMessage = getUserFriendlyErrorMessage(err);
      uiState.setError(errorMessage);
      showError(errorMessage, 'Error al cargar inscripciones');
    }
  };

  // Cancelar inscripción
  const cancelEnrollment = async (enrollmentId: string) => {
    try {
      setCancellingId(enrollmentId);
      
      // Usar la función del servicio en lugar de llamada directa a API
      await deleteEnrollment(parseInt(enrollmentId));
      
      // Remover de la lista local
      const currentData = uiState.data || [];
      const updatedData = currentData.filter(e => e.id !== enrollmentId);
      uiState.setSuccess(updatedData);
      
      showSuccess('Inscripción cancelada exitosamente');
    } catch (err: any) {
      console.error('Error cancelling enrollment:', err);
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/inscripcion?next=/inscripcion/mis-inscripciones');
        return;
      }
      
      const errorMessage = getUserFriendlyErrorMessage(err);
      showError(errorMessage, 'Error al cancelar inscripción');
    } finally {
      setCancellingId(null);
    }
  };

  // Formatear fecha usando timezone de Guatemala
  const formatDate = (dateString: string) => {
    try {
      return formatGT(dateString);
    } catch {
      return dateString;
    }
  };

  // Formatear hora usando timezone de Guatemala
  const formatTime = (dateString: string) => {
    try {
      return formatGTTime(dateString);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Logo className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900">Congreso Digital UMG</span>
              </div>
            </div>
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Inscripciones</h1>
          <p className="text-gray-600">
            Aquí puedes ver y gestionar todas tus inscripciones a actividades del congreso.
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Sesión iniciada como: <span className="font-medium">{user.email || user.name}</span>
            </p>
          )}
        </div>

        {/* Enrollments List with State Management */}
        <EnrollmentsStateWrapper
          uiState={uiState}
          onRetry={loadEnrollments}
        >
          <div className="space-y-4">
            {uiState.data?.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {enrollment.activityTitle}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(enrollment.activityStartTime)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(enrollment.activityStartTime)} - {formatTime(enrollment.activityEndTime)}
                        </span>
                      </div>
                      
                      {enrollment.activityLocation && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{enrollment.activityLocation}</span>
                        </div>
                      )}
                      
                      {enrollment.organizationName && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{enrollment.organizationName}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Inscrito el {formatDate(enrollment.enrolledAt)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => cancelEnrollment(enrollment.id)}
                    disabled={cancellingId === enrollment.id}
                    className="ml-4 flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancellingId === enrollment.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {cancellingId === enrollment.id ? 'Cancelando...' : 'Cancelar'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </EnrollmentsStateWrapper>
      </div>
    </div>
  );
}