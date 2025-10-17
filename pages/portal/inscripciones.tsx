import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/portal/PortalLayout';
import { Calendar, Clock, MapPin, Users, QrCode, Download } from 'lucide-react';
import { EnrollmentUI, ActivityUI } from '@/types/ui';
import { apiClient } from '@/lib/api';
import { formatGT, formatGTTime } from '@/lib/datetime';

interface EnrollmentWithActivity {
  id: string;
  userId: string;
  activityId: string;
  seatNumber: string;
  qrCodeId: string;
  enrolledAt: Date;
  attended: boolean;
  activity: {
    id: string;
    title: string;
    kind: string;
    location: string;
    startTime: string;
    endTime: string;
    capacity: number;
    enrolled: number;
    instructor: string;
    description: string;
  };
}

const InscripcionesPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamar al endpoint que ya tiene manejo de errores seguro
      const data = await apiClient.get('users/me/enrollments');
      
      // El endpoint siempre devuelve un array, incluso en caso de error
      const enrollmentsData = Array.isArray(data) ? data : [];
      
      // Mapear a formato esperado por la UI
      const mappedEnrollments: EnrollmentWithActivity[] = enrollmentsData.map((enrollment: any) => ({
        id: enrollment.id?.toString() || '',
        userId: user?.id || '',
        activityId: enrollment.activityId?.toString() || '',
        seatNumber: enrollment.seatNumber || 'Sin asignar',
        qrCodeId: `qr_${enrollment.id}`,
        enrolledAt: new Date(enrollment.createdAt || Date.now()),
        attended: enrollment.status === 'attended',
        activity: {
          id: enrollment.activity?.id?.toString() || '',
          title: enrollment.activity?.title || 'Actividad sin título',
          kind: 'taller', // Default kind
          location: enrollment.activity?.location || 'Ubicación no especificada',
          startTime: enrollment.activity?.startDate || new Date().toISOString(),
          endTime: enrollment.activity?.endDate || new Date().toISOString(),
          capacity: 30, // Default capacity
          enrolled: 0, // Default enrolled
          instructor: 'Por definir',
          description: enrollment.activity?.description || 'Sin descripción'
        }
      }));
      
      setEnrollments(mappedEnrollments);
    } catch (err) {
      // En caso de cualquier error, mostrar estado vacío sin romper la UI
      console.warn('Error loading enrollments, showing empty state:', err);
      setEnrollments([]);
      setError(null); // No mostrar error al usuario
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatGT(dateString);
  };

  const formatTime = (dateString: string) => {
    return formatGTTime(dateString);
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'taller':
        return 'bg-blue-100 text-blue-800';
      case 'competencia':
        return 'bg-red-100 text-red-800';
      case 'conferencia':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'taller':
        return 'Taller';
      case 'competencia':
        return 'Competencia';
      case 'conferencia':
        return 'Conferencia';
      default:
        return kind;
    }
  };

  const handleShowQR = (qrCodeId: string) => {
    setSelectedQR(qrCodeId);
  };

  const handleDownloadQR = (qrCodeId: string, activityTitle: string) => {
    try {
      // Crear un canvas para generar el QR
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 300;
      canvas.width = size;
      canvas.height = size;

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Texto del QR (simplificado - en producción usar librería QR)
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(qrCodeId, size / 2, size / 2 - 10);
      ctx.fillText(activityTitle, size / 2, size / 2 + 10);
      ctx.fillText('Congreso Tecnológico 2024', size / 2, size / 2 + 30);

      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${activityTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Error downloading QR:', err);
    }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Inscripciones</h1>
              <p className="text-gray-600">
                Tienes {enrollments.length} actividad{enrollments.length !== 1 ? 'es' : ''} registrada{enrollments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de inscripciones */}
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes inscripciones</h3>
            <p className="text-gray-600 mb-4">Aún no te has inscrito en ninguna actividad del congreso.</p>
            <a
              href="/inscripcion"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explorar Actividades
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {enrollment.activity.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getKindColor(enrollment.activity.kind)}`}>
                          {getKindLabel(enrollment.activity.kind)}
                        </span>
                      </div>
                      {enrollment.attended && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Asistido
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(enrollment.activity.startTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(enrollment.activity.startTime)} - {formatTime(enrollment.activity.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{enrollment.activity.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Asiento: {enrollment.seatNumber}</span>
                      </div>
                    </div>

                    {enrollment.activity.description && (
                      <p className="text-gray-600 mt-3">{enrollment.activity.description}</p>
                    )}

                    {enrollment.activity.instructor && (
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>Instructor:</strong> {enrollment.activity.instructor}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => handleShowQR(enrollment.qrCodeId)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Ver QR</span>
                    </button>
                    <button
                      onClick={() => handleDownloadQR(enrollment.qrCodeId, enrollment.activity.title)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal QR */}
        {selectedQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Código QR de Asistencia</h3>
                <div className="bg-gray-100 p-8 rounded-lg mb-4">
                  {/* TODO: Implementar generación de QR real */}
                  <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Presenta este código QR al momento de la actividad
                </p>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default InscripcionesPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Redirect unauthenticated users to login
  if (!session?.user) {
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }

  // Check portal access (roleLevel >= 1)
  const roleLevel = session.user.roleLevel || 0;
  if (roleLevel < 1) {
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};