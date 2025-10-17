import React, { useState, useRef, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useAuth } from '@/contexts/AuthContext';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Camera, QrCode, CheckCircle, XCircle, AlertCircle, ArrowLeft, RotateCcw, Shield, Wifi, Lock, Edit3 } from 'lucide-react';
import { apiClient } from '@/lib/api';

/**
 * Política de Data Fetching:
 * Esta página NO debe usar getServerSideProps ni getStaticProps
 * para mantener la consistencia con el resto del portal.
 */

interface ScanResult {
  success: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface SecurityCheck {
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
}

function MarcarAsistenciaContent() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verificar contexto seguro y disponibilidad de cámara
  const checkSecurityContext = (): SecurityCheck => {
    // Verificación más robusta del contexto seguro
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           location.hostname === 'localhost' || 
                           location.hostname === '127.0.0.1' ||
                           location.hostname.endsWith('.localhost') ||
                           location.hostname === '::1';
    
    const hasMediaDevices = !!(navigator.mediaDevices);
    const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia);
    
    return {
      isSecureContext,
      hasMediaDevices,
      hasGetUserMedia
    };
  };

  // Verificar permisos de cámara
  const checkCameraPermissions = async (): Promise<'granted' | 'denied' | 'prompt'> => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permission.state as 'granted' | 'denied' | 'prompt';
      }
      return 'prompt'; // Si no se puede verificar, asumir que se necesita solicitar
    } catch (error) {
      console.warn('No se pudo verificar permisos de cámara:', error);
      return 'prompt';
    }
  };

  // Función para procesar asistencia
  const markAttendance = async (qrData: string): Promise<ScanResult> => {
    try {
      const data = await apiClient.post('attendance/mark', { qrData, userId: user?.id }) as any;

      // Marcar que se necesita refrescar los datos de inscripciones
      localStorage.setItem('refreshEnrollments', 'true');
      
      return {
        success: true,
        message: data.message || 'Asistencia registrada exitosamente',
        type: 'success'
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return {
        success: false,
        message: 'Error de conexión. Intenta nuevamente.',
        type: 'error'
      };
    }
  };

  // Iniciar cámara con verificaciones de seguridad
  const startCamera = async () => {
    try {
      // Limpiar errores previos
      setCameraError(null);
      setScanResult(null);
      
      // Verificar contexto seguro
      const security = checkSecurityContext();
      setSecurityCheck(security);
      
      if (!security.isSecureContext) {
        setCameraError('insecure-context');
        setShowManualFallback(true);
        setScanResult({
          success: false,
          message: 'La cámara requiere un contexto seguro (HTTPS). Usa el código manual.',
          type: 'warning'
        });
        return;
      }
      
      if (!security.hasMediaDevices || !security.hasGetUserMedia) {
        setCameraError('no-media-devices');
        setShowManualFallback(true);
        setScanResult({
          success: false,
          message: 'Tu navegador no soporta acceso a la cámara. Usa el código manual.',
          type: 'warning'
        });
        return;
      }
      
      // Verificar permisos
      const permission = await checkCameraPermissions();
      setPermissionState(permission);
      
      if (permission === 'denied') {
        setCameraError('permission-denied');
        setShowManualFallback(true);
        setScanResult({
          success: false,
          message: 'Permisos de cámara denegados. Usa el código manual o habilita la cámara.',
          type: 'warning'
        });
        return;
      }
      
      setIsScanning(true);
      
      // Intentar primero con cámara trasera, luego frontal como fallback
      const constraints = [
        {
          video: {
            facingMode: 'environment', // Cámara trasera en móviles
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        {
          video: {
            facingMode: 'user', // Cámara frontal como fallback
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        {
          video: true // Cualquier cámara disponible
        }
      ];
      
      let stream: MediaStream | null = null;
      let lastError: any = null;
      
      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (error) {
          lastError = error;
          console.warn('Failed with constraint:', constraint, error);
        }
      }
      
      if (!stream) {
        throw lastError || new Error('No camera available');
      }
      
      streamRef.current = stream;
      setPermissionState('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setIsScanning(false);
      
      // Manejar diferentes tipos de errores
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setCameraError('permission-denied');
        setShowManualFallback(true);
        setScanResult({
          success: false,
          message: 'Permisos de cámara denegados. Habilita la cámara en tu navegador o usa el código manual.',
          type: 'warning'
        });
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('no-camera');
        setShowManualFallback(true);
        setScanResult({
          success: false,
          message: 'No se encontró ninguna cámara en tu dispositivo. Usa el código manual.',
          type: 'warning'
        });
      } else if (error.name === 'NotSupportedError') {
        setCameraError('not-supported');
        setShowManualFallback(true);
        setScanResult({
          success: false,
          message: 'Tu navegador no soporta acceso a la cámara. Usa el código manual.',
          type: 'warning'
        });
      } else if (error.name === 'OverconstrainedError') {
        setCameraError('overconstrained');
        setShowManualFallback(true);
        setScanResult({
          success: false,
          message: 'La cámara no cumple con los requisitos. Usa el código manual.',
          type: 'warning'
        });
      } else {
        setCameraError('unknown');
        setScanResult({
          success: false,
          message: 'Error inesperado al acceder a la cámara. Usa el código manual.',
          type: 'error'
        });
        setShowManualFallback(true);
      }
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Procesar QR manual
  const handleManualQR = async () => {
    if (!qrInput.trim()) {
      setScanResult({
        success: false,
        message: 'Por favor ingresa un código QR válido',
        type: 'error'
      });
      return;
    }

    setIsProcessing(true);
    const result = await markAttendance(qrInput.trim());
    setScanResult(result);
    setIsProcessing(false);
    setQrInput('');
  };

  // Reintentar acceso a la cámara
  const retryCamera = async () => {
    setCameraError(null);
    setScanResult(null);
    setShowManualFallback(false);
    setPermissionState('unknown');
    await startCamera();
  };

  // Verificar contexto seguro al cargar y limpiar al desmontar
  useEffect(() => {
    const initializeCamera = async () => {
      const security = checkSecurityContext();
      setSecurityCheck(security);
      
      // Si el contexto no es seguro o no hay soporte para cámara, mostrar fallback automáticamente
      if (!security.isSecureContext || !security.hasMediaDevices || !security.hasGetUserMedia) {
        setShowManualFallback(true);
        
        if (!security.isSecureContext) {
          setCameraError('insecure-context');
          setScanResult({
            success: false,
            message: 'Contexto no seguro detectado. Usa el código manual para marcar asistencia.',
            type: 'warning'
          });
        } else {
          setCameraError('no-media-devices');
          setScanResult({
            success: false,
            message: 'Cámara no disponible. Usa el código manual para marcar asistencia.',
            type: 'warning'
          });
        }
      } else {
        // Verificar permisos sin iniciar la cámara automáticamente
        try {
          const permission = await checkCameraPermissions();
          setPermissionState(permission);
        } catch (error) {
          console.warn('Error checking camera permissions:', error);
        }
      }
    };
    
    initializeCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-8 w-8 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <AlertCircle className="h-8 w-8 text-gray-600" />;
    }
  };

  const getResultBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Renderizar mensaje de contexto inseguro
  const renderInsecureContextMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <Shield className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Contexto No Seguro Detectado
          </h3>
          <p className="text-red-800 mb-4">
            La cámara requiere un contexto seguro (HTTPS) para funcionar por razones de seguridad. 
            Actualmente estás accediendo desde: <code className="bg-red-200 px-1 rounded text-xs">{location.protocol}//{location.host}</code>
          </p>
          <div className="bg-red-100 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-red-900 mb-2 flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Soluciones para desarrolladores:
            </h4>
            <ul className="text-sm text-red-800 space-y-2">
              <li className="flex items-start">
                <span className="font-medium mr-2">1.</span>
                <span>Usa <code className="bg-red-200 px-1 rounded">https://localhost</code> en lugar de <code className="bg-red-200 px-1 rounded">http://localhost</code></span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">2.</span>
                <span>Configura un certificado SSL local para desarrollo</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">3.</span>
                <span>En Chrome: Habilita <code className="bg-red-200 px-1 rounded">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">4.</span>
                <span>Usa un túnel HTTPS como ngrok o localtunnel</span>
              </li>
            </ul>
          </div>
          <div className="bg-blue-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Para usuarios finales:</strong> Contacta al administrador del sistema para acceder a través de HTTPS.
            </p>
          </div>
          <p className="text-sm text-red-700">
            <strong>Alternativa segura:</strong> Puedes usar el ingreso manual del código QR a continuación.
          </p>
        </div>
      </div>
    </div>
  );

  // Renderizar mensaje de permisos denegados
  const renderPermissionDeniedMessage = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <Camera className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">
            Permisos de Cámara Denegados
          </h3>
          <p className="text-yellow-800 mb-4">
            Has denegado el acceso a la cámara. Para escanear códigos QR, necesitas permitir el acceso.
          </p>
          <div className="bg-yellow-100 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-yellow-900 mb-2">
              Cómo habilitar la cámara:
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Haz clic en el ícono de cámara en la barra de direcciones</li>
              <li>• Selecciona "Permitir" para el acceso a la cámara</li>
              <li>• Recarga la página si es necesario</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <button
              onClick={retryCamera}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar mensaje de dispositivo sin cámara
  const renderNoCameraMessage = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Cámara No Disponible
          </h3>
          <p className="text-blue-800 mb-4">
            No se detectó ninguna cámara en tu dispositivo o el navegador no soporta acceso a la cámara.
          </p>
          <p className="text-sm text-blue-700">
            <strong>Solución:</strong> Usa el ingreso manual del código QR a continuación.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/portal" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Portal
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Marcar Asistencia
          </h1>
          <p className="text-gray-600">
            Escanea el código QR de la actividad para registrar tu asistencia
          </p>
        </div>

        {/* Mensajes de seguridad y errores */}
        {securityCheck && !securityCheck.isSecureContext && renderInsecureContextMessage()}
        {cameraError === 'permission-denied' && renderPermissionDeniedMessage()}
        {cameraError === 'no-camera' && renderNoCameraMessage()}

        {/* Resultado del escaneo */}
        {scanResult && (
          <div className={`rounded-lg border p-6 mb-8 ${getResultBgColor(scanResult.type)}`}>
            <div className="flex items-center">
              {getResultIcon(scanResult.type)}
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {scanResult.success ? '¡Éxito!' : 'Atención'}
                </h3>
                <p className="text-gray-700 mt-1">
                  {scanResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Escaneo con cámara */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Camera className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Escanear con Cámara</h2>
            </div>
            
            <div className="space-y-4">
              {securityCheck?.isSecureContext && securityCheck.hasMediaDevices ? (
                !isScanning ? (
                  <div className="text-center py-8">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Usa la cámara de tu dispositivo para escanear el código QR
                    </p>
                    <button
                      onClick={startCamera}
                      disabled={cameraError === 'permission-denied'}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      {cameraError === 'permission-denied' ? 'Permisos Denegados' : 'Iniciar Cámara'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 border-2 border-white border-dashed m-8 rounded-lg pointer-events-none" />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={stopCamera}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Detener Cámara
                      </button>
                      <button
                        onClick={retryCamera}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 text-center">
                      Apunta la cámara hacia el código QR para escanearlo automáticamente
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {!securityCheck?.isSecureContext 
                      ? 'Cámara no disponible en contexto no seguro'
                      : 'Cámara no disponible en este dispositivo'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Usa el código manual a continuación
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Entrada manual */}
          <div className={`bg-white rounded-lg shadow-sm p-6 ${(showManualFallback || !securityCheck?.isSecureContext || !securityCheck?.hasMediaDevices) ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
            <div className="flex items-center mb-4">
              <QrCode className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Código Manual</h2>
              {(showManualFallback || !securityCheck?.isSecureContext || !securityCheck?.hasMediaDevices) && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Recomendado
                </span>
              )}
            </div>
            
            {(showManualFallback || !securityCheck?.isSecureContext || !securityCheck?.hasMediaDevices) && (
              <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Alternativa segura:</strong> Ingresa manualmente el código que aparece en tu código QR.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Código QR
                </label>
                <input
                  id="qr-input"
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Ingresa el código QR manualmente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                />
              </div>
              
              <button
                onClick={handleManualQR}
                disabled={isProcessing || !qrInput.trim()}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  'Marcar Asistencia'
                )}
              </button>
              
              <p className="text-sm text-gray-600">
                Si no puedes escanear, puedes ingresar el código manualmente
              </p>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Instrucciones
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Asegúrate de tener buena iluminación al escanear</li>
                <li>• Mantén el código QR dentro del marco de la cámara</li>
                <li>• Si tienes problemas, puedes ingresar el código manualmente</li>
                <li>• Solo puedes marcar asistencia una vez por actividad</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarcarAsistenciaPage() {
  return <MarcarAsistenciaContent />;
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

  // Check if user has enrollments (portal access requires enrollments)
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