import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useAuth } from '@/contexts/AuthContext';

import { getCurrentUserEnrollments, UserEnrollment } from '@/services/enrollments';
import { api, apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { formatGT, formatGTTime, formatGTShort } from '@/lib/datetime';
import { 
  User, 
  Mail, 
  Building2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  Award, 
  Download, 
  Edit3, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Trophy
} from 'lucide-react';

interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  orgName?: string;
  isUmg: boolean;
  avatarUrl?: string;
  roles: string[];
}

interface Certificate {
  id: string;
  activityId: string;
  activityTitle: string;
  activityType: string;
  completedAt: string;
  isGenerated: boolean;
  hours: number;
  instructor?: string;
  certificateUrl?: string;
}

function MiCuentaContent() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'enrollments' | 'certificates'>('profile');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Refrescar datos del usuario
        await refreshUser();
        
        // Cargar perfil del estudiante
        try {
          const profileData = await apiClient.get('/student/profile');
          setProfile(profileData);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
        
        // Cargar inscripciones
        const userEnrollments = await getCurrentUserEnrollments();
        setEnrollments(userEnrollments);
        
        // Cargar certificados
        try {
          const certificatesData = await apiClient.get('/student/certificates');
          setCertificates(certificatesData);
        } catch (error) {
          console.error('Error loading certificates:', error);
        }
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshUser]);

  // Efecto para refrescar datos cuando se marca asistencia
  useEffect(() => {
    const checkForRefresh = () => {
      const shouldRefresh = localStorage.getItem('refreshEnrollments');
      if (shouldRefresh === 'true') {
        localStorage.removeItem('refreshEnrollments');
        // Recargar todos los datos
        const loadData = async () => {
          try {
            await refreshUser();
            
            // Cargar inscripciones
            const userEnrollments = await getCurrentUserEnrollments();
            setEnrollments(userEnrollments);
            
            // Cargar certificados actualizados
            try {
              const certificatesData = await apiClient.get('/student/certificates');
              setCertificates(certificatesData);
            } catch (error) {
              console.error('Error loading certificates:', error);
            }
          } catch (err) {
            console.error('Error refreshing data:', err);
          }
        };
        loadData();
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'attended':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const downloadCertificate = async (certificate: Certificate) => {
    // Verificar si el usuario ha confirmado asistencia
    const enrollment = enrollments.find(e => e.activityId.toString() === certificate.activityId);
    if (!enrollment || enrollment.attended !== true) {
      alert('Debes confirmar tu asistencia antes de descargar el diploma');
      return;
    }

    try {
      if (certificate.certificateUrl) {
        // Descargar certificado existente
        const link = document.createElement('a');
        link.href = certificate.certificateUrl;
        link.download = `diploma-${certificate.activityTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generar certificado
        try {
          const result = await apiClient.post(`/student/certificates/${certificate.id}/generate`);
          // Actualizar la lista de certificados
          setCertificates(prev => prev.map(cert => 
            cert.id === certificate.id 
              ? { ...cert, certificateUrl: result.certificateUrl, isGenerated: true }
              : cert
          ));
          
          // Descargar el certificado generado
          const link = document.createElement('a');
          link.href = result.certificateUrl;
          link.download = `diploma-${certificate.activityTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Error generating certificate:', error);
          alert('Error al generar el certificado. Intenta nuevamente.');
        }
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error al descargar el certificado. Intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando información...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/portal" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Portal
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.fullName || user?.name || 'Mi Cuenta'}
                  </h1>
                  <p className="text-gray-600">{profile?.email || user?.email}</p>
                  {profile?.orgName && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Building2 className="h-4 w-4 mr-1" />
                      <span>{profile.orgName}</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Información Personal
              </button>
              <button
                onClick={() => setActiveTab('enrollments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'enrollments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Mis Inscripciones ({enrollments.length})
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'certificates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Award className="h-4 w-4 inline mr-2" />
                Diplomas ({certificates.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Personal</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Correo Electrónico
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{profile?.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Nombre Completo
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{profile?.fullName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Organización
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {profile?.orgName || 'No especificada'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Trophy className="h-4 w-4 inline mr-2" />
                  Tipo de Usuario
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {profile?.isUmg ? 'Estudiante UMG' : 'Estudiante Externo'}
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Estadísticas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Actividades Inscritas:</span>
                  <span className="ml-2 text-blue-900">{enrollments.length}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Actividades Completadas:</span>
                  <span className="ml-2 text-blue-900">
                    {enrollments.filter(e => e.attended === true).length}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Diplomas Disponibles:</span>
                  <span className="ml-2 text-blue-900">{certificates.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mis Inscripciones</h2>
            
            {enrollments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes inscripciones</h3>
                <p className="text-gray-600 mb-4">Explora nuestras actividades disponibles y regístrate.</p>
                <Link 
                  href="/inscripcion" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ir a Actividades
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {enrollment.activity?.title || 'Actividad sin título'}
                        </h3>
                        
                        {enrollment.activity && (
                          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>
                                {formatGTShort(enrollment.activity.startDate)}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {formatGTTime(enrollment.activity.startDate)} - {formatGTTime(enrollment.activity.endDate)}
                              </span>
                            </div>
                            
                            {enrollment.activity.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{enrollment.activity.location}</span>
                              </div>
                            )}
                            
                            {enrollment.seatNumber && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>Asiento: {enrollment.seatNumber}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(enrollment.status || 'confirmed')}
                        <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(enrollment.status || 'confirmed')}`}>
                          {getStatusText(enrollment.status || 'confirmed')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        Inscrito el {formatGT(enrollment.createdAt || enrollment.enrolledAt)}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/inscripcion/actividad/${enrollment.activity?.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mis Diplomas</h2>
            
            {certificates.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes diplomas disponibles</h3>
                <p className="text-gray-600">
                  Los diplomas estarán disponibles después de completar las actividades.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {certificate.activityTitle}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Tipo: {certificate.activityType}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Duración: {certificate.hours} horas</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              Completado: {formatGT(certificate.completedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Award className="h-8 w-8 text-yellow-500" />
                    </div>
                    
                    <button
                      onClick={() => downloadCertificate(certificate)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {certificate.isGenerated ? 'Descargar Diploma' : 'Generar y Descargar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MiCuentaPage() {
  return <MiCuentaContent />;
}

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