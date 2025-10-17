import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, CameraOff, X, Shield, Lock, AlertCircle, RotateCcw, Keyboard, QrCode } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

interface SecurityCheck {
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
}

export default function QRScanner({ isOpen, onClose, onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificar contexto seguro y disponibilidad de cámara
  const checkSecurityContext = (): SecurityCheck => {
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           location.hostname === 'localhost' || 
                           location.hostname === '127.0.0.1';
    
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

  // Reintentar acceso a la cámara
  const retryCamera = async () => {
    setError(null);
    setPermissionState('unknown');
    setShowManualInput(false);
    await initScanner();
  };

  // Manejar entrada manual de QR
  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      onError?.('Por favor ingresa un código QR válido');
      return;
    }

    setIsProcessing(true);
    try {
      // Simular un pequeño delay para mostrar el estado de procesamiento
      await new Promise(resolve => setTimeout(resolve, 500));
      onScan(manualInput.trim());
      setManualInput('');
      onClose();
    } catch (error) {
      onError?.('Error al procesar el código QR manual');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  const initScanner = async () => {
    try {
      // Verificar contexto seguro
      const security = checkSecurityContext();
      setSecurityCheck(security);
      
      if (!security.isSecureContext) {
        setError('insecure-context');
        onError?.('La cámara requiere un contexto seguro (HTTPS) para funcionar.');
        return;
      }
      
      if (!security.hasMediaDevices || !security.hasGetUserMedia) {
        setError('no-media-devices');
        onError?.('Tu navegador no soporta acceso a la cámara.');
        return;
      }

      // Verificar permisos
      const permission = await checkCameraPermissions();
      setPermissionState(permission);
      
      if (permission === 'denied') {
        setError('permission-denied');
        onError?.('Acceso a la cámara denegado. Por favor, permite el acceso a la cámara en tu navegador.');
        return;
      }

      // Primero solicitar permisos de cámara explícitamente
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Preferir cámara trasera
          } 
        });
        // Detener el stream inmediatamente, solo necesitamos verificar permisos
        stream.getTracks().forEach(track => track.stop());
        setPermissionState('granted');
      } catch (permissionError: any) {
        console.error('Error de permisos de cámara:', permissionError);
        
        // Manejar diferentes tipos de errores
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          setPermissionState('denied');
          setError('permission-denied');
          onError?.('Se requiere acceso a la cámara para escanear códigos QR. Por favor, permite el acceso a la cámara en tu navegador.');
        } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
          setError('no-camera');
          onError?.('No se encontró ninguna cámara en el dispositivo.');
        } else {
          setError('unknown');
          onError?.('Error inesperado al acceder a la cámara.');
        }
        return;
      }

      // Verificar si hay cámaras disponibles
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);

      if (!hasCamera) {
        setError('no-camera');
        onError?.('No se encontró ninguna cámara en el dispositivo');
        return;
      }

      // Crear el escáner QR
      const qrScanner = new QrScanner(
        videoRef.current!,
        (result) => {
          console.log('QR escaneado:', result.data);
          onScan(result.data);
          stopScanner();
          onClose();
        },
        {
          onDecodeError: (err) => {
            // No mostrar errores de decodificación constantes
            console.debug('Error de decodificación QR:', err);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Usar cámara trasera si está disponible
        }
      );

      qrScannerRef.current = qrScanner;
      
      // Iniciar el escáner
      await qrScanner.start();
      setIsScanning(true);
      setError(null);

    } catch (err) {
      console.error('Error al inicializar el escáner QR:', err);
      let errorMessage = 'Error desconocido al acceder a la cámara';
      
      if (err instanceof Error) {
        if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
          errorMessage = 'Acceso a la cámara denegado. Por favor, permite el acceso a la cámara en tu navegador y recarga la página.';
          setError('permission-denied');
        } else if (err.message.includes('NotFoundError') || err.message.includes('DevicesNotFoundError')) {
          errorMessage = 'No se encontró ninguna cámara en el dispositivo.';
          setError('no-camera');
        } else if (err.message.includes('NotReadableError') || err.message.includes('TrackStartError')) {
          errorMessage = 'La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara.';
          setError('camera-busy');
        } else {
          errorMessage = err.message;
          setError('unknown');
        }
      }
      
      onError?.(errorMessage);
    }
  };

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    initScanner();

    // Cleanup al cerrar
    return () => {
      stopScanner();
    };
  }, [isOpen, onScan, onError, onClose]);

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    setManualInput('');
    setShowManualInput(false);
    onClose();
  };

  // Renderizar mensaje de contexto inseguro
  const renderInsecureContextMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-white p-6">
      <Shield className="h-16 w-16 mb-4 text-red-400" />
      <h3 className="text-lg font-medium mb-2">Contexto No Seguro</h3>
      <p className="text-center mb-4 text-sm opacity-90">
        La cámara requiere HTTPS para funcionar. Actualmente estás en un contexto no seguro.
      </p>
      <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4 text-xs">
        <h4 className="font-medium mb-2 flex items-center">
          <Lock className="h-3 w-3 mr-1" />
          Soluciones:
        </h4>
        <ul className="space-y-1 opacity-75">
          <li>• Usa https://localhost en lugar de http://localhost</li>
          <li>• Configura un certificado SSL local</li>
          <li>• Usa un navegador que permita cámara en localhost</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowManualInput(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Ingreso Manual
        </button>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  // Renderizar mensaje de permisos denegados
  const renderPermissionDeniedMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-white p-6">
      <Camera className="h-16 w-16 mb-4 text-yellow-400" />
      <h3 className="text-lg font-medium mb-2">Permisos Denegados</h3>
      <p className="text-center mb-4 text-sm opacity-90">
        Has denegado el acceso a la cámara. Para escanear códigos QR, necesitas permitir el acceso.
      </p>
      <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4 text-xs">
        <h4 className="font-medium mb-2">Cómo habilitar:</h4>
        <ul className="space-y-1 opacity-75">
          <li>• Haz clic en el ícono de cámara en la barra de direcciones</li>
          <li>• Selecciona "Permitir" para el acceso a la cámara</li>
          <li>• Recarga la página si es necesario</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <button
          onClick={retryCamera}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reintentar
        </button>
        <button
          onClick={() => setShowManualInput(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Ingreso Manual
        </button>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  // Renderizar mensaje de dispositivo sin cámara
  const renderNoCameraMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-white p-6">
      <CameraOff className="h-16 w-16 mb-4 text-gray-400" />
      <h3 className="text-lg font-medium mb-2">Cámara No Disponible</h3>
      <p className="text-center mb-4 text-sm opacity-90">
        No se detectó ninguna cámara en tu dispositivo o el navegador no soporta acceso a la cámara.
      </p>
      <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4 text-xs">
        <p className="text-center opacity-75">
          Puedes ingresar el código QR manualmente como alternativa.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowManualInput(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Ingreso Manual
        </button>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  // Renderizar entrada manual
  const renderManualInput = () => (
    <div className="flex flex-col items-center justify-center h-full text-white p-6">
      <QrCode className="h-16 w-16 mb-4 text-blue-400" />
      <h3 className="text-lg font-medium mb-2">Ingreso Manual</h3>
      <p className="text-center mb-6 text-sm opacity-90">
        Ingresa el código QR manualmente
      </p>
      
      <div className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="manual-qr" className="block text-sm font-medium mb-2">
            Código QR
          </label>
          <input
            id="manual-qr"
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyPress={handleManualKeyPress}
            placeholder="Pega o escribe el código aquí"
            className="w-full px-3 py-2 bg-black bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
            autoFocus
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleManualSubmit}
            disabled={isProcessing || !manualInput.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Procesar
              </>
            )}
          </button>
          <button
            onClick={() => setShowManualInput(false)}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver
          </button>
        </div>
        
        <div className="text-xs text-center opacity-75">
          <p>Presiona Enter para procesar el código</p>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-md max-h-96 mx-4">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold">
            {showManualInput ? 'Ingreso Manual' : 'Escanear Código QR'}
          </h3>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition-colors p-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content container */}
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          {showManualInput ? renderManualInput() :
           error === 'insecure-context' ? renderInsecureContextMessage() :
           error === 'permission-denied' ? renderPermissionDeniedMessage() :
           error === 'no-camera' || error === 'no-media-devices' ? renderNoCameraMessage() :
           error ? (
            <div className="flex flex-col items-center justify-center h-full text-white p-6">
              <AlertCircle className="h-16 w-16 mb-4 text-red-400" />
              <p className="text-center mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={retryCamera}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reintentar
                </button>
                <button
                  onClick={() => setShowManualInput(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Overlay de escaneo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Marco de escaneo */}
                  <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                  
                  {/* Línea de escaneo animada */}
                  {isScanning && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-pulse"></div>
                  )}
                </div>
              </div>

              {/* Instrucciones y botón manual */}
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <div className="bg-black bg-opacity-50 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Camera className="h-5 w-5 text-white mr-2" />
                    <span className="text-white text-sm">
                      {isScanning ? 'Escaneando...' : 'Iniciando cámara...'}
                    </span>
                  </div>
                  <p className="text-white text-xs opacity-75 mb-3">
                    Apunta la cámara hacia el código QR
                  </p>
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  >
                    <Keyboard className="h-3 w-3 mr-1" />
                    Ingreso Manual
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}