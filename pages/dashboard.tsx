import React, { useState, useEffect } from 'react';
import { QrCode, History, Users, Calendar, BarChart3, Clock, CheckCircle, XCircle, Shield, Settings, UserPlus, FileText } from 'lucide-react';
import { DashboardGuard } from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffStats, useAttendanceHistory } from '@/services/staffService';
import { scanQR } from '@/services/staffService';
import { toast } from 'sonner';
import QrScanner from 'qr-scanner';

interface QRScanResult {
  success: boolean;
  message: string;
  attendance?: {
    id?: string;
    studentName?: string;
    userName?: string;
    activityTitle?: string;
    timestamp?: string;
    checkInTime?: string;
    status?: 'present' | 'late' | 'absent';
  };
}

function DashboardPage() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // Fetch staff stats and attendance history
  const { stats, error: statsError, isLoading: statsLoading } = useStaffStats();
  const { records: attendanceHistory, error: historyError, isLoading: historyLoading } = useAttendanceHistory();

  // Obtener roleLevel del usuario
  const roleLevel = user?.roleLevel || 0;

  // Verificar permisos específicos
  const isAsistente = roleLevel === 1;
  const isAdmin = roleLevel === 2;
  const isDevAdmin = roleLevel === 3;

  // Handle QR code scanning
  const handleScanQR = async (qrData: string) => {
    try {
      const result = await scanQR({ qrCode: qrData });
      setScanResult({
        success: true,
        message: `Asistencia registrada: ${result.userName}`,
        attendance: {
          userName: result.userName,
          activityTitle: result.activityTitle,
          checkInTime: result.checkInTime,
          id: result.attendanceId
        }
      });
      toast.success('Asistencia registrada exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al escanear QR';
      setScanResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  // Initialize QR scanner
  const initQRScanner = () => {
    setShowScanner(true);
    setIsScanning(true);
    
    // Request camera permission and start scanning
    QrScanner.hasCamera().then(hasCamera => {
      if (!hasCamera) {
        toast.error('No se detectó cámara disponible');
        setIsScanning(false);
        return;
      }

      const qrScanner = new QrScanner(
        document.getElementById('qr-video') as HTMLVideoElement,
        result => {
          if (result.data) {
            handleScanQR(result.data);
            qrScanner.stop();
            qrScanner.destroy();
            setIsScanning(false);
            setShowScanner(false);
          }
        },
        {
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScanner.start().catch(err => {
        console.error('Error starting QR scanner:', err);
        toast.error('Error al iniciar el escáner QR');
        setIsScanning(false);
      });

      // Cleanup function
      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }).catch(err => {
      console.error('Error checking camera:', err);
      toast.error('Error al verificar la cámara');
      setIsScanning(false);
    });
  };

  // Handle manual QR input
  const handleManualQRInput = (qrData: string) => {
    if (qrData.trim()) {
      handleScanQR(qrData.trim());
    }
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'present':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
      case 'late':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock };
      case 'absent':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock };
    }
  };

  // Función para renderizar secciones específicas por rol
  const renderRoleSpecificSections = () => {
    if (isDevAdmin) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Gestión de Usuarios - Solo DevAdmin */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/usuarios'}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Administrar Usuarios
              </button>
              <button
                onClick={() => window.location.href = '/admin/staff'}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <Shield className="h-4 w-4 mr-2" />
                Gestionar Staff
              </button>
            </div>
          </div>

          {/* Configuración del Sistema - Solo DevAdmin */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-6 w-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/configuracion'}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración General
              </button>
              <button
                onClick={() => window.location.href = '/admin/metricas'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Métricas del Sistema
              </button>
            </div>
          </div>

          {/* Gestión del Congreso - Admin y DevAdmin */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Gestión Congreso</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/talleres'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Gestionar Talleres
              </button>
              <button
                onClick={() => window.location.href = '/admin/categorias'}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Categorías
              </button>
            </div>
          </div>
        </div>
      );
    } else if (isAdmin) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gestión del Congreso - Admin */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Gestión Congreso</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/talleres'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Gestionar Talleres
              </button>
              <button
                onClick={() => window.location.href = '/admin/categorias'}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Categorías
              </button>
              <button
                onClick={() => window.location.href = '/admin/participantes'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Participantes
              </button>
            </div>
          </div>

          {/* Gestión de Asistencia - Admin */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Reportes</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/admin/asistencia'}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <History className="h-4 w-4 mr-2" />
                Reporte de Asistencia
              </button>
              <button
                onClick={() => window.location.href = '/admin/metricas'}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Métricas
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return null; // Asistente no ve secciones adicionales
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Control - {isDevAdmin ? 'DevAdmin' : isAdmin ? 'Administrador' : 'Asistente'}
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido, {user?.name}. {isAsistente ? 'Gestiona asistencias y consulta estadísticas.' : isAdmin ? 'Gestiona el congreso, asistencia y usuarios.' : 'Control total del sistema.'}
          </p>
        </div>

        {/* Secciones específicas por rol */}
        {renderRoleSpecificSections()}

        {/* Stats Cards - Comunes para todos los roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Staff</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalParticipants || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Staff Activo</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.todayAttendance || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Staff Inactivo</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.todayAttendance || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Invitaciones</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.pendingTasks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Scanner Section - Solo para Asistente y superiores */}
          {(isAsistente || isAdmin || isDevAdmin) && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Escáner QR
                </h2>
              </div>

              {!showScanner ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Escanea el código QR del estudiante para registrar su asistencia.
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={initQRScanner}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <QrCode className="h-5 w-5 mr-2" />
                      Iniciar Escáner QR
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">o</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código QR Manual
                      </label>
                      <input
                        type="text"
                        placeholder="Ingresa el código QR manualmente"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleManualQRInput((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {scanResult && (
                    <div className={`p-4 rounded-lg ${scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center">
                        {scanResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        )}
                        <p className={`text-sm ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {scanResult.message}
                        </p>
                      </div>
                      {scanResult.attendance && (
                        <div className="mt-2 text-sm text-green-700">
                          <p>Estudiante: {scanResult.attendance.userName}</p>
                          <p>Actividad: {scanResult.attendance.activityTitle}</p>
                          <p>Hora: {scanResult.attendance.checkInTime ? new Date(scanResult.attendance.checkInTime).toLocaleTimeString() : 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      id="qr-video"
                      className="w-full h-64 object-cover rounded-lg border-2 border-dashed border-gray-300"
                      autoPlay
                      muted
                      playsInline
                    />
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p>Escaneando...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowScanner(false);
                      setIsScanning(false);
                    }}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cerrar Escáner
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Attendance History */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <History className="h-5 w-5 mr-2" />
                Historial de Asistencia
              </h2>
            </div>

            {historyLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando historial...</p>
              </div>
            ) : historyError ? (
              <div className="text-red-600 text-center py-4">
                <p>Error al cargar el historial</p>
              </div>
            ) : attendanceHistory && attendanceHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attendanceHistory.slice(0, 10).map((record: any, index: number) => {
                  const StatusIcon = getStatusInfo(record.status || 'present').icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className={`h-5 w-5 ${getStatusInfo(record.status || 'present').color}`} />
                        <div>
                          <p className="font-medium text-gray-900">{record.userName || 'Usuario'}</p>
                          <p className="text-sm text-gray-500">{record.activityTitle || 'Actividad'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.checkInTime ? new Date(record.checkInTime).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                <p>No hay registros de asistencia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardGuard>
      <DashboardPage />
    </DashboardGuard>
  );
}