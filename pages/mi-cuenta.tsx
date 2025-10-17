import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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

export default function MiCuenta() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'enrollments' | 'certificates'>('enrollments');

  useEffect(() => {
    // Solo proceder cuando AuthContext haya terminado de cargar
    if (!loading) {
      if (!user) {
        // Si no está logueado, redirigir a inscripción
        router.replace('/inscripcion');
        return;
      }
    }
  }, [user, loading, router]);

  // V2: Separate effect for data loading with stable dependencies
  useEffect(() => {
    if (!loading && user?.id && !hasLoadedData && !dataLoading) {
      loadData();
    }
  }, [user?.id, loading, hasLoadedData, dataLoading]); // Stable dependencies

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (dataLoading || hasLoadedData) return;
    
    try {
      setDataLoading(true);
      setError(null);
      
      // Load data in parallel for better performance
      const [profileResult, enrollmentsResult, certificatesResult] = await Promise.allSettled([
        api.get('student/profile'),
        getCurrentUserEnrollments(),
        api.get('student/certificates')
      ]);
      
      // Handle profile data
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
      } else {
        console.warn('Error loading profile:', profileResult.reason);
      }
      
      // Handle enrollments data
      if (enrollmentsResult.status === 'fulfilled') {
        setEnrollments(enrollmentsResult.value);
      } else {
        console.error('Error loading enrollments:', enrollmentsResult.reason);
        setError('Error al cargar las inscripciones');
      }
      
      // Handle certificates data
      if (certificatesResult.status === 'fulfilled') {
        setCertificates(certificatesResult.value);
      } else {
        console.warn('Error loading certificates:', certificatesResult.reason);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setDataLoading(false);
      setHasLoadedData(true);
    }
  };

  if (loading || (dataLoading && !hasLoadedData)) {
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
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('enrollments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'enrollments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Mis Inscripciones
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
                Mis Certificados
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Mi Perfil
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'enrollments' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mis Inscripciones</h2>
            
            {enrollments.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">¡Comienza tu experiencia!</h3>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
                  Descubre talleres, conferencias y actividades diseñadas para potenciar tu crecimiento profesional. 
                  <span className="block mt-2 font-medium text-blue-600">¡Tu próximo aprendizaje te está esperando!</span>
                </p>
                <div className="space-y-4">
                  <Link 
                    href="/inscripcion" 
                    className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <BookOpen className="h-5 w-5 mr-3" />
                    Explorar Actividades
                  </Link>
                  <div className="text-sm text-gray-500">
                    <span className="inline-flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Inscripciones abiertas
                    </span>
                  </div>
                </div>
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
                            <div className="flex items-center">
                               <Users className="h-4 w-4 mr-1" />
                               <span className="capitalize">{enrollment.activityKind}</span>
                             </div>
                          </div>
                        )}
                        
                        {enrollment.activity?.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {enrollment.activity.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col items-end">
                        <div className="flex items-center mb-2">
                          {enrollment.attended === true ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-1" />
                              <span className="text-sm font-medium">Asistencia confirmada</span>
                            </div>
                          ) : enrollment.attended === false ? (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-5 w-5 mr-1" />
                              <span className="text-sm font-medium">No asistió</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-yellow-600">
                              <AlertCircle className="h-5 w-5 mr-1" />
                              <span className="text-sm font-medium">Pendiente</span>
                            </div>
                          )}
                        </div>
                        
                        <span className="text-xs text-gray-500">
                          Inscrito: {formatGT(enrollment.enrolledAt)}
                        </span>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mis Certificados</h2>
            
            {certificates.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-yellow-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Award className="h-12 w-12 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Tus certificados aparecerán aquí</h3>
                <p className="text-gray-600 mb-6 max-w-lg mx-auto text-lg">
                  Los certificados se generan automáticamente después de confirmar tu asistencia a las actividades.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-semibold text-blue-900 mb-1">¿Cómo obtener certificados?</h4>
                      <ol className="text-sm text-blue-800 space-y-1">
                        <li>1. Inscríbete en actividades</li>
                        <li>2. Asiste y marca tu presencia</li>
                        <li>3. Descarga tu certificado aquí</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {certificate.activityTitle}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 gap-4">
                          <span className="capitalize">{certificate.activityType}</span>
                          <span>{certificate.hours} horas</span>
                          {certificate.instructor && <span>Instructor: {certificate.instructor}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Completado: {formatGT(certificate.completedAt)}
                        </p>
                      </div>
                      
                      <div className="ml-4">
                        {certificate.isGenerated ? (
                          <button
                            onClick={() => downloadCertificate(certificate)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </button>
                        ) : (
                          <button
                            onClick={() => downloadCertificate(certificate)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Generar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mi Perfil</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile?.fullName || user?.name || 'No disponible'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{profile?.email || user?.email}</span>
                  </div>
                </div>
                
                {profile?.orgName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organización
                    </label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{profile.orgName}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de usuario
                  </label>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Trophy className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">Estudiante</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{enrollments.length}</p>
                        <p className="text-sm text-blue-600">Inscripciones</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {enrollments.filter(e => e.attended === true).length}
                        </p>
                        <p className="text-sm text-green-600">Asistencias</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Award className="h-8 w-8 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{certificates.length}</p>
                        <p className="text-sm text-yellow-600">Certificados</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Helper function for downloading certificates
  async function downloadCertificate(certificate: Certificate) {
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
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error al descargar el certificado. Intenta nuevamente.');
    }
  }
}

export const getServerSideProps = async (ctx: any) => {
  const cookie = ctx.req.headers.cookie ?? "";
  // Variables de entorno unificadas para SSR/cliente
  const baseRoot = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5213';
  const base = baseRoot.replace(/\/$/, '');

  const me = await fetch(base + "/api/auth/session", { headers: { cookie }, credentials: "include" });
  if (me.status === 401) return { redirect: { destination: "/inscripcion", permanent: false } };

  const sum = await fetch(base + "/api/enrollments/summary", { headers: { cookie }, credentials: "include" });
  const { count = 0 } = await sum.json().catch(() => ({ count: 0 }));
  if (count === 0) return { redirect: { destination: "/inscripcion", permanent: false } };

  return { props: {} };
};