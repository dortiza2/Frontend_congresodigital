import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

import Navbar from '@/components/Navbar';
import { Camera, X, CheckCircle, XCircle, AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { scanQR, type QRScanRequest, type QRScanResponse } from '@/services/staffService';
import { useErrorHandler } from '@/lib/errorHandler';



function QRScannerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<QRScanResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [manualToken, setManualToken] = useState('');

  // Inicializar cámara
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  // Cambiar cámara (frontal/trasera)
  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Procesar check-in con token QR
  const processCheckIn = async (token: string) => {
    setIsProcessing(true);
    
    try {
      const scanRequest: QRScanRequest = { qrCode: token };
      const result = await scanQR(scanRequest);

      setScanResult(result);
      
      // Auto-limpiar resultado después de 3 segundos si es exitoso
      if (result.success) {
        setTimeout(() => {
          setScanResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing check-in:', error);
      handleError(error, 'Error al procesar el código QR');
      setScanResult({
        success: false,
        message: 'Error al procesar el código QR. Por favor, intenta nuevamente.'
      });
    }

    setIsProcessing(false);
  };

  // Simular escaneo de QR (en una implementación real usarías una librería como jsQR)
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Simular procesamiento de QR
      // En una implementación real, aquí usarías jsQR o similar para extraer el token
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Por ahora, simular la extracción de un token del QR
      // En producción, esto vendría de la librería de QR
      const mockToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      // Procesar el token extraído
      await processCheckIn(mockToken);
    }

    setIsProcessing(false);
  };

  // Procesar token manual
  const handleManualToken = async () => {
    if (!manualToken.trim()) {
      setError('Por favor ingresa un token válido');
      return;
    }
    
    await processCheckIn(manualToken.trim());
    setManualToken('');
  };

  // Limpiar resultado
  const clearResult = () => {
    setScanResult(null);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Escanear QR
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Registra asistencia escaneando códigos QR
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cámara */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cámara
                  </h2>
                  <div className="flex gap-2">
                    {isScanning && (
                      <button
                        onClick={switchCamera}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Cambiar cámara"
                      >
                        <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    {!isScanning ? (
                      <button
                        onClick={startCamera}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        Iniciar Cámara
                      </button>
                    ) : (
                      <button
                        onClick={stopCamera}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Detener
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative aspect-video bg-gray-900">
                {isScanning ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay de escaneo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Marco de escaneo */}
                        <div className="w-64 h-64 border-4 border-blue-500 rounded-lg relative">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                        </div>
                        
                        {/* Línea de escaneo animada */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Botón de captura */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={captureAndScan}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" />
                            Escanear QR
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <Camera className="h-16 w-16 mx-auto mb-4" />
                      <p>Presiona "Iniciar Cámara" para comenzar</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-red-600 text-white p-4 rounded-lg max-w-sm text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="mt-2 px-4 py-2 bg-red-700 rounded hover:bg-red-800 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de resultados */}
          <div className="space-y-6">
            {/* Resultado del escaneo */}
            {scanResult && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resultado
                  </h3>
                  <button
                    onClick={clearResult}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                <div className={`p-4 rounded-lg ${
                  scanResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {scanResult.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        scanResult.success 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {scanResult.message}
                      </p>
                      
                      {scanResult.userName && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Participante:</strong> {scanResult.userName}
                          </p>
                          {scanResult.activityTitle && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Actividad:</strong> {scanResult.activityTitle}
                            </p>
                          )}
                          {scanResult.checkInTime && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Hora:</strong> {scanResult.checkInTime}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Entrada manual de token */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Entrada Manual
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="manual-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token de Check-in
                  </label>
                  <input
                    id="manual-token"
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Ingresa el token manualmente"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isProcessing}
                  />
                </div>
                <button
                  onClick={handleManualToken}
                  disabled={isProcessing || !manualToken.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Procesando...' : 'Procesar Token'}
                </button>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Instrucciones
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                  <p>Presiona "Iniciar Cámara" para activar la cámara</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                  <p>Apunta la cámara hacia el código QR del participante</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                  <p>Presiona "Escanear QR" cuando el código esté en el marco</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
                  <p>Revisa el resultado en el panel lateral</p>
                </div>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estadísticas de Hoy
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Asistencias registradas</span>
                  <span className="font-semibold text-gray-900 dark:text-white">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">QRs escaneados</span>
                  <span className="font-semibold text-gray-900 dark:text-white">92</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Errores</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export default function QRScannerPage() {
  return <QRScannerContent />;
}

export const getServerSideProps = async (ctx: any) => {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('../api/auth/[...nextauth]');
  
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);
    
    // Verificar si hay sesión
    if (!session || !session.user) {
      return {
        redirect: {
          destination: '/inscripcion?next=/staff/scan',
          permanent: false,
        },
      };
    }

    // Verificar rol de staff (roleLevel >= 1)
    const roleLevel = session.user.roleLevel || 0;
    
    if (roleLevel < 1) {
      // Si no está autenticado o no tiene permisos, redirigir al login
      return {
        redirect: {
          destination: '/inscripcion?next=/staff/scan',
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
    console.error('Error in staff/scan getServerSideProps:', error);
    return {
      redirect: {
        destination: '/inscripcion?next=/staff/scan',
        permanent: false,
      },
    };
  }
};