import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

import Logo from '@/components/Logo';
import QRScanner from '@/components/QRScanner';
import { QrCode, Scan, CheckCircle, XCircle, User, Calendar, Clock, MapPin, Camera } from 'lucide-react';
import { getToken } from '@/lib/authClient';
import { apiClient } from '@/lib/api';

// Función para marcar asistencia usando el endpoint real
const markAttendance = async (token: string, authToken: string) => {
  try {
    const data = await apiClient.post('attendances/checkin', { token }) as any;

    return {
      success: true,
      message: data.message || 'Asistencia registrada correctamente',
      attendanceRecord: {
        id: `attendance_${Date.now()}`,
        qrCodeId: token,
        timestamp: new Date(data.checkInTime || new Date()),
        participantName: 'Participante', // Podríamos obtener esto del token decodificado
        activityTitle: 'Actividad del Congreso',
        activityTime: 'Horario de la actividad',
        activityLocation: 'Ubicación de la actividad',
        wasAlreadyCheckedIn: data.wasAlreadyCheckedIn || false
      }
    };
  } catch (error) {
    console.error('Error al marcar asistencia:', error);
    return {
      success: false,
      message: 'Error de conexión al servidor'
    };
  }
};

interface AttendanceRecord {
  id: string;
  qrCodeId: string;
  timestamp: Date;
  participantName: string;
  activityTitle: string;
  activityTime: string;
  activityLocation: string;
  wasAlreadyCheckedIn?: boolean;
}

interface ScanResult {
  success: boolean;
  message: string;
  attendanceRecord?: AttendanceRecord;
}

export default function AsistenciaPage() {
  const router = useRouter();
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleScan = async () => {
    if (!qrInput.trim()) {
      alert('Por favor ingresa un código QR');
      return;
    }

    const token = getToken();
    if (!token) {
      alert('No hay sesión activa');
      return;
    }

    try {
      setScanning(true);
      setLastScanResult(null);
      
      const result = await markAttendance(qrInput.trim(), token);
      setLastScanResult(result);
      
      if (result.success && result.attendanceRecord) {
        setAttendanceHistory(prev => [result.attendanceRecord!, ...prev]);
      }
      
      // Limpiar input después del escaneo
      setQrInput('');
    } catch (error) {
      console.error('Error al procesar QR:', error);
      setLastScanResult({
        success: false,
        message: 'Error al procesar el código QR'
      });
    } finally {
      setScanning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      // El token viene directamente del QR
      const token = getToken();
      if (!token) {
        setLastScanResult({
          success: false,
          message: 'No hay sesión activa'
        });
        return;
      }

      setScanning(true);
      setLastScanResult(null);
      
      const result = await markAttendance(qrData, token);
      setLastScanResult(result);
      
      if (result.success && result.attendanceRecord) {
        setAttendanceHistory(prev => [result.attendanceRecord!, ...prev]);
      }
    } catch (error) {
      console.error('Error al procesar QR escaneado:', error);
      setLastScanResult({
        success: false,
        message: 'Error al procesar el código QR escaneado'
      });
    } finally {
      setScanning(false);
    }
  };

  const handleScannerError = (error: string) => {
    console.error('Error del escáner QR:', error);
    setLastScanResult({
      success: false,
      message: `Error del escáner: ${error}`
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100">
        {/* Header */}
        <header className="bg-white border-b border-neutral-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <Logo />
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600">Toma de Asistencia</span>
                <button
                  onClick={() => router.push('/')}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Lector de QR - Asistencia</h1>
            <p className="text-slate-600">Escanea o ingresa el código QR para registrar la asistencia</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Panel de escaneo */}
            <div className="bg-white rounded-lg border border-neutral-300 p-6">
              <div className="flex items-center mb-4">
                <Scan className="h-6 w-6 text-slate-600 mr-2" />
                <h2 className="text-xl font-semibold text-slate-900">Escáner QR</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="qr-input" className="block text-sm font-medium text-slate-700 mb-2">
                    Código QR
                  </label>
                  <input
                    id="qr-input"
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pega o escribe el código QR aquí"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    disabled={scanning}
                  />
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleScan}
                    disabled={scanning || !qrInput.trim()}
                    className="w-full bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {scanning ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <QrCode className="h-4 w-4 mr-2" />
                        Procesar QR
                      </div>
                    )}
                  </button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">o</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowQRScanner(true)}
                    disabled={scanning}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center justify-center">
                      <Camera className="h-4 w-4 mr-2" />
                      Escanear con Cámara
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Resultado del último escaneo */}
              {lastScanResult && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  lastScanResult.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center mb-2">
                    {lastScanResult.success ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    <span className="font-medium">
                      {lastScanResult.success ? 'Éxito' : 'Error'}
                    </span>
                  </div>
                  <p className="text-sm">{lastScanResult.message}</p>
                  
                  {lastScanResult.success && lastScanResult.attendanceRecord && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>{lastScanResult.attendanceRecord.participantName}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{lastScanResult.attendanceRecord.activityTitle}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{lastScanResult.attendanceRecord.activityTime}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{lastScanResult.attendanceRecord.activityLocation}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Historial de asistencias */}
            <div className="bg-white rounded-lg border border-neutral-300 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Historial de Asistencias</h2>
              
              {attendanceHistory.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay registros de asistencia</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {attendanceHistory.map((record) => (
                    <div key={record.id} className="border border-neutral-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{record.participantName}</span>
                        <span className="text-xs text-slate-500">
                          {record.timestamp.toLocaleTimeString('es-GT')}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p className="font-medium">{record.activityTitle}</p>
                        <p>{record.activityTime} • {record.activityLocation}</p>
                        <p className="text-xs font-mono text-slate-400 mt-1">{record.qrCodeId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Escáner QR Modal */}
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScan}
          onError={handleScannerError}
        />
      </div>
  );
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

  // Check role level (roleLevel >= 1 for dashboard access)
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