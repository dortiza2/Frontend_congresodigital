import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

import PortalLayout from '@/components/portal/PortalLayout';
import { Award, Download, Eye, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useErrorHandler } from '@/lib/errorHandler';
import { getCurrentUserEnrollments, UserEnrollment } from '@/services/enrollments';
import { apiClient } from '@/lib/api';
// unifiedApi module does not exist; remove the import and use apiClient instead

interface Certificate {
  id: string;
  userId: string;
  activityId: string;
  activityTitle: string;
  activityType: 'taller' | 'competencia' | 'conferencia';
  completedAt: Date;
  certificateUrl?: string;
  isGenerated: boolean;
  hours: number;
  instructor?: string;
}

// Tipos de API para certificados
interface StudentCertificateAPIItem {
  id: string | number;
  userId: string | number;
  activityId?: string | number;
  activityTitle?: string;
  createdAt?: string;
  isGenerated?: boolean;
  hours?: number | string;
  downloadUrl?: string;
}

interface GenerateCertificateResponse {
  certificateUrl?: string;
  message?: string;
}

const DiplomasPage = () => {
  const { handleError } = useErrorHandler();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const checkForRefresh = () => {
      const shouldRefresh = localStorage.getItem('refreshEnrollments');
      if (shouldRefresh === 'true') {
        localStorage.removeItem('refreshEnrollments');
        loadData();
      }
    };

    checkForRefresh();
    window.addEventListener('storage', checkForRefresh);
    window.addEventListener('focus', checkForRefresh);

    return () => {
      window.removeEventListener('storage', checkForRefresh);
      window.removeEventListener('focus', checkForRefresh);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [certificatesResponse, enrollmentsData] = await Promise.all([
        apiClient.get('/student/certificates'),
        getCurrentUserEnrollments()
      ]);

      const certArray: StudentCertificateAPIItem[] = Array.isArray(certificatesResponse)
        ? (certificatesResponse as StudentCertificateAPIItem[])
        : [];

      const mapped: Certificate[] = certArray.map((cert) => ({
        id: String(cert.id),
        userId: String(cert.userId),
        activityId: String(cert.activityId ?? ''),
        activityTitle: cert.activityTitle || 'Actividad',
        activityType: 'taller',
        completedAt: new Date(cert.createdAt ?? new Date().toISOString()),
        isGenerated: Boolean(cert.isGenerated ?? false),
        hours: Number(cert.hours ?? 0),
        instructor: '',
        certificateUrl: cert.downloadUrl
      }));

      setCertificates(mapped);
      setEnrollments(enrollmentsData);
    } catch (err) {
      const { error: apiError } = handleError(err, 'loadData');
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const hasConfirmedAttendance = (activityId: string): boolean => {
    if (!activityId) return true;
    const enrollment = enrollments.find(e => String(e.activityId) === String(activityId));
    return enrollment?.attended === true;
  };

  // Normaliza URLs relativas de certificados para apuntar al backend
  const getAbsoluteUrl = (url: string): string => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const normalizedBase = base.replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${normalizedBase}${normalizedUrl}`;
  };

  const generateCertificate = async (certificateId: string) => {
    const certificate = certificates.find(c => c.id === certificateId);
    if (certificate && !hasConfirmedAttendance(certificate.activityId)) {
      setError('Debes confirmar tu asistencia antes de generar el diploma');
      return;
    }

    try {
      setGenerating(certificateId);
      setError(null);

      const data: GenerateCertificateResponse = await apiClient.post(`/student/certificates/${certificateId}/generate`);

      setCertificates(prev =>
        prev.map(cert =>
          cert.id === certificateId
            ? { ...cert, isGenerated: true, certificateUrl: data.certificateUrl }
            : cert
        )
      );
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError(err instanceof Error ? err.message : 'Error al generar el certificado');
    } finally {
      setGenerating(null);
    }
  };

  const downloadCertificate = (certificate: Certificate) => {
    if (!hasConfirmedAttendance(certificate.activityId)) {
      setError('Debes confirmar tu asistencia antes de descargar el diploma');
      return;
    }

    if (!certificate.certificateUrl) return;

    try {
      const link = document.createElement('a');
      link.href = getAbsoluteUrl(certificate.certificateUrl);
      link.download = `certificado-${certificate.activityTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      setError('Error al descargar el certificado');
    }
  };

  const previewCertificate = (certificate: Certificate) => {
    if (!hasConfirmedAttendance(certificate.activityId)) {
      setError('Debes confirmar tu asistencia antes de ver el diploma');
      return;
    }

    if (!certificate.certificateUrl) return;

    try {
      const url = getAbsoluteUrl(certificate.certificateUrl);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error previewing certificate:', err);
      setError('Error al abrir la vista previa del certificado');
    }
  };


  const getTypeColor = (type: string) => {
    switch (type) {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'taller':
        return 'Taller';
      case 'competencia':
        return 'Competencia';
      case 'conferencia':
        return 'Conferencia';
      default:
        return type;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalHours = certificates.reduce((sum, cert) => sum + cert.hours, 0);
  const completedCertificates = certificates.filter(cert => cert.isGenerated).length;

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
            <div className="bg-yellow-100 p-3 rounded-full">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Certificados</h1>
              <p className="text-gray-600">
                {completedCertificates} de {certificates.length} certificados disponibles
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de certificados</p>
                <p className="text-xl font-semibold text-gray-900">{certificates.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Certificados generados</p>
                <p className="text-xl font-semibold text-gray-900">{completedCertificates}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas acumuladas</p>
                <p className="text-xl font-semibold text-gray-900">{totalHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Certificados */}
        {certificates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="bg-yellow-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Award className="h-12 w-12 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes certificados disponibles aún</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Los certificados se generan automáticamente al completar una actividad y confirmar tu asistencia.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Participa en talleres y competencias para obtener tus certificados.
              </p>
            </div>

            <div className="mt-6">
              <a
                href="/portal/inscripciones"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Mis Inscripciones
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {certificate.activityTitle}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(certificate.activityType)}`}>
                            {getTypeLabel(certificate.activityType)}
                          </span>
                          {certificate.isGenerated ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Generado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Fecha de emisión: {formatDate(certificate.completedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Horas: {certificate.hours}</span>
                      </div>
                      {certificate.instructor && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Instructor:</span>
                          <span>{certificate.instructor}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0 flex items-center space-x-3">
                    {!hasConfirmedAttendance(certificate.activityId) ? (
                      <div className="flex items-center text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span className="mr-3">Asistencia pendiente</span>
                        <a
                          href="/portal/asistencia"
                          className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs"
                        >
                          Marcar asistencia
                        </a>
                      </div>
                    ) : !certificate.certificateUrl ? (
                      <button
                        onClick={() => generateCertificate(certificate.id)}
                        disabled={generating === certificate.id}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                      >
                        <Award className={`h-4 w-4 ${generating === certificate.id ? 'animate-pulse' : ''}`} />
                        <span>
                          {generating === certificate.id ? 'Generando...' : 'Generar'}
                        </span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => previewCertificate(certificate)}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver</span>
                        </button>
                        <button
                          onClick={() => downloadCertificate(certificate)}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Descargar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">Información sobre Certificados</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="font-bold">•</span>
              <span>Los certificados se generan automáticamente al completar una actividad</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold">•</span>
              <span>Puedes descargar tus certificados en formato PDF</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold">•</span>
              <span>Los certificados incluyen las horas de participación</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-bold">•</span>
              <span>Si tienes problemas con un certificado, contacta al soporte</span>
            </li>
          </ul>
        </div>
      </div>
    </PortalLayout>
  );
};

export default DiplomasPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};