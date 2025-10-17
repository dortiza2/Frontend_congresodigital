import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { useAuth } from '@/contexts/AuthContext';

import { getCurrentUserEnrollments, UserEnrollment } from '@/services/enrollments';
import { getUser } from '@/lib/authClient';
import { api, apiClient } from '@/lib/api';
import QRCodeModal from '@/components/QRCodeModal';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, BookOpen, Award, QrCode, Download, Building2, AlertCircle, User } from 'lucide-react';
import { formatGTShort, formatGTTime } from '@/lib/datetime';

function PortalContent() {
  const { user, refreshUser } = useAuth();
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(null);
  const [selectedActivityTitle, setSelectedActivityTitle] = useState<string>('');
  const [selectedQrToken, setSelectedQrToken] = useState<string>('');

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        setLoading(true);
        
        // Refrescar datos del usuario para asegurar que estén actualizados
        await refreshUser();
        
        const userEnrollments = await getCurrentUserEnrollments();
        setEnrollments(userEnrollments);
      } catch (err) {
        console.error('Error loading enrollments:', err);
        // En lugar de mostrar error, mostrar estado vacío para no romper la UI
        console.warn('Error loading enrollments, showing empty state instead');
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, [refreshUser]);

  // Efecto para refrescar datos cuando se marca asistencia
  useEffect(() => {
    const checkForRefresh = () => {
      const shouldRefresh = localStorage.getItem('refreshEnrollments');
      if (shouldRefresh === 'true') {
        localStorage.removeItem('refreshEnrollments');
        // Recargar inscripciones
        const loadEnrollments = async () => {
          try {
            await refreshUser();
            const userEnrollments = await getCurrentUserEnrollments();
            setEnrollments(userEnrollments);
          } catch (err) {
            console.error('Error refreshing enrollments:', err);
          }
        };
        loadEnrollments();
      }
    };

    // Verificar inmediatamente al montar el componente
    checkForRefresh();

    // Escuchar cambios en el localStorage y cuando la ventana recibe foco
    window.addEventListener('storage', checkForRefresh);
    window.addEventListener('focus', checkForRefresh);

    return () => {
      window.removeEventListener('storage', checkForRefresh);
      window.removeEventListener('focus', checkForRefresh);
    };
  }, [refreshUser]);

  const openQRModal = (enrollmentId: number, activityTitle: string, qrToken?: string) => {
    setSelectedEnrollmentId(enrollmentId);
    setSelectedActivityTitle(activityTitle);
    setSelectedQrToken(qrToken || '');
    setQrModalOpen(true);
  };
  
  const closeQRModal = () => {
    setQrModalOpen(false);
    setSelectedEnrollmentId(null);
    setSelectedActivityTitle('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmado';
      case 'attended':
        return 'Asistencia Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const canDownloadDiploma = (enrollment: UserEnrollment) => {
    return enrollment.attended === true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con información personal */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user?.name || 'Portal del Estudiante'}
              </h1>
              <p className="text-gray-600 mb-4">
                {user?.email}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="h-4 w-4 mr-1" />
                <span>{user?.organization || 'No registrado'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/portal/mi-cuenta" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <User className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Mi Cuenta</h3>
            </div>
            <p className="text-gray-600">Ver perfil, inscripciones y diplomas</p>
          </Link>

          <Link href="/inscripcion/mis-inscripciones" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Mis Inscripciones</h3>
            </div>
            <p className="text-gray-600">Ver y gestionar tus actividades inscritas</p>
          </Link>

          <Link href="/portal/marcar-asistencia" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <QrCode className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Marcar Asistencia</h3>
            </div>
            <p className="text-gray-600">Escanea códigos QR para confirmar tu asistencia</p>
          </Link>

          <Link href="/podio" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <Award className="h-8 w-8 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Podio</h3>
            </div>
            <p className="text-gray-600">Ver rankings y reconocimientos</p>
          </Link>
        </div>

        {/* Mis Actividades */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mis Actividades</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando actividades...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aún no tienes actividades inscritas</h3>
              <p className="text-gray-600 mb-4">Explora nuestras actividades disponibles y regístrate.</p>
              <Link 
                href="/inscripcion" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Actividades
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {enrollment.activityTitle || enrollment.activity?.title || 'Actividad sin título'}
                      </h3>
                      
                      <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4 mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {(() => {
                              const dateStr = enrollment.startTime || enrollment.activity?.startDate;
                              return dateStr ? formatGTShort(dateStr) : 'Fecha no disponible';
                            })()}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {(() => {
                              const startStr = enrollment.startTime || enrollment.activity?.startDate;
                              const endStr = enrollment.endTime || enrollment.activity?.endDate;
                              if (!startStr || !endStr) return 'Horario no disponible';
                              return `${formatGTTime(startStr)} - ${formatGTTime(endStr)}`;
                            })()}
                          </span>
                        </div>
                        
                        {(enrollment.location || enrollment.activity?.location) && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{enrollment.location || enrollment.activity?.location}</span>
                          </div>
                        )}
                        
                        {enrollment.seatNumber && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Asiento: {enrollment.seatNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(enrollment.status || 'confirmed')}`}>
                          {getStatusText(enrollment.status || 'confirmed')}
                        </span>
                        
                        <button
                          onClick={() => openQRModal(parseInt(enrollment.id) || 0, enrollment.activityTitle || enrollment.activity?.title || 'Actividad', enrollment.qrToken || enrollment.qrCodeId)}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          Ver QR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Sección de Diplomas */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Diplomas</h2>
          
          {enrollments.filter(e => canDownloadDiploma(e)).length === 0 ? (
            <div className="text-center py-6">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes diplomas disponibles aún.</p>
              <p className="text-sm text-gray-500 mt-1">
                Los diplomas estarán disponibles después de confirmar tu asistencia mediante check-in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments
                .filter(e => canDownloadDiploma(e))
                .map((enrollment) => (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {enrollment.activityTitle || enrollment.activity?.title || 'Actividad'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Completado el {formatGTShort(enrollment.activity?.endDate || '')}
                        </p>
                      </div>
                      <Award className="h-6 w-6 text-yellow-500" />
                    </div>
                    
                    <button 
                      onClick={async () => {
                        try {
                          // Buscar el certificado para esta inscripción
                          const certificates = await apiClient.get('/student/certificates');
                          const certificate = certificates.find((cert: any) => 
                            cert.activityId === enrollment.activity?.id
                          );

                          if (certificate && certificate.certificateUrl) {
                            // Descargar el certificado
                            const link = document.createElement('a');
                            link.href = certificate.certificateUrl;
                            link.download = `diploma-${enrollment.activity?.title?.replace(/\s+/g, '-').toLowerCase()}.pdf`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            alert('El diploma aún no está disponible para descarga');
                          }
                        } catch (error) {
                          console.error('Error downloading diploma:', error);
                          alert('Error al descargar el diploma. Intenta nuevamente.');
                        }
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Diploma
                    </button>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organización</label>
              <p className="mt-1 text-sm text-gray-900">{user?.organization}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Usuario</label>
              <p className="mt-1 text-sm text-gray-900">
                {user?.roles?.length ? 'Estudiante' : 'Estudiante'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de QR */}
       {selectedEnrollmentId && (
         <QRCodeModal
           isOpen={qrModalOpen}
           onClose={closeQRModal}
           enrollmentId={selectedEnrollmentId}
           activityTitle={selectedActivityTitle}
           userEmail={user?.email || ''}
           qrToken={selectedQrToken}
         />
       )}
    </div>
  );
};

export default function PortalPage() {
  return <PortalContent />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions);
    
    // Verificar si hay sesión
    if (!session || !session.user) {
      return {
        redirect: {
          destination: '/inscripcion?next=/portal',
          permanent: false,
        },
      };
    }

    // Verificar rol mínimo (roleLevel >= 1)
    const roleLevel = session.user.roleLevel || 0;
    
    if (roleLevel < 1) {
      return {
        redirect: {
          destination: '/inscripcion?next=/portal',
          permanent: false,
        },
      };
    }

    return {
      props: {
        session,
      },
    };
  } catch (error) {
    console.error('Error in portal getServerSideProps:', error);
    return {
      redirect: {
        destination: '/inscripcion?next=/portal',
        permanent: false,
      },
    };
  }
};