import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/portal/PortalLayout';
import { api, apiClient } from '@/lib/api';
import { QrCode, Download, Share2, RefreshCw, User } from 'lucide-react';

interface QRData {
  id: string;
  userId: string;
  qrCode: string;
  isActive: boolean;
  expiresAt?: Date;
  generatedAt: Date;
}

const QRPage = () => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiClient.get('/student/qr');
      setQrData({
        id: data.id,
        userId: data.userId,
        qrCode: data.qrCode,
        isActive: data.isActive,
        generatedAt: new Date(data.generatedAt),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
      });
    } catch (err) {
      console.error('Error loading QR code:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const generateNewQR = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      await apiClient.post('/student/qr/generate');

      // Recargar el QR después de generar uno nuevo
      await loadQRCode();
    } catch (err) {
      console.error('Error generating new QR code:', err);
      setError(err instanceof Error ? err.message : 'Error al generar nuevo código QR');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrData) return;
    
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
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(qrData.qrCode, size / 2, size / 2);
      ctx.fillText('Código QR - Congreso 2024', size / 2, size / 2 + 20);

      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-congreso-${qrData.userId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Error downloading QR:', err);
      setError('Error al descargar el código QR');
    }
  };

  const shareQR = async () => {
    if (!qrData) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mi código QR - Congreso Tecnológico',
          text: `Mi código de acceso: ${qrData.qrCode}`,
          url: window.location.href
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(qrData.qrCode);
        alert('Código copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt?: Date) => {
    if (!expiresAt) return false;
    const now = new Date();
    const timeDiff = expiresAt.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 2; // Expira en 2 días o menos
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
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            {error}
          </div>
          <button
            onClick={loadQRCode}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Código QR</h1>
              <p className="text-gray-600">Tu código de acceso al congreso</p>
            </div>
          </div>
        </div>

        {qrData && (
          <>
            {/* Información del usuario */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-gray-100 p-2 rounded-full">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-600">{user?.organization}</p>
                </div>
              </div>
            </div>

            {/* Código QR principal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-6">
              <div className="mb-6">
                {/* TODO: Implementar generación de QR real */}
                <div className="w-64 h-64 mx-auto bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <QrCode className="h-24 w-24 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Código QR</p>
                    <p className="text-xs text-gray-400 mt-1">{qrData.qrCode}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-lg font-semibold text-gray-900">Código de Acceso</p>
                <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-2 rounded">
                  {qrData.qrCode}
                </p>
              </div>

              {/* Estado del QR */}
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${qrData.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${qrData.isActive ? 'text-green-700' : 'text-red-700'}`}>
                  {qrData.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Información de expiración */}
              {qrData.expiresAt && (
                <div className={`p-3 rounded-lg mb-6 ${
                  isExpiringSoon(qrData.expiresAt) 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <p className={`text-sm ${
                    isExpiringSoon(qrData.expiresAt) 
                      ? 'text-yellow-800' 
                      : 'text-gray-600'
                  }`}>
                    <strong>Expira:</strong> {formatDate(qrData.expiresAt)}
                  </p>
                  {isExpiringSoon(qrData.expiresAt) && (
                    <p className="text-xs text-yellow-700 mt-1">
                      ⚠️ Tu código expira pronto. Considera generar uno nuevo.
                    </p>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={downloadQR}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar</span>
                </button>
                <button
                  onClick={shareQR}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Compartir</span>
                </button>
                <button
                  onClick={generateNewQR}
                  disabled={generating}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                  <span>{generating ? 'Generando...' : 'Nuevo QR'}</span>
                </button>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Instrucciones de Uso</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start space-x-2">
                  <span className="font-bold">1.</span>
                  <span>Presenta este código QR al ingresar al congreso</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">2.</span>
                  <span>También úsalo para registrar tu asistencia a las actividades</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">3.</span>
                  <span>Mantén tu código activo y no lo compartas con otros</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold">4.</span>
                  <span>Si tienes problemas, contacta al personal del evento</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default QRPage;

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