import React, { useState } from 'react';
import { apiClient } from '@/lib/api';
import QRScanner from '@/components/QRScanner';

interface AttendanceRecord {
  id: string;
  userId: string;
  activityId: string;
  timestamp: string;
  isValid: boolean;
  message?: string;
}

interface CheckinApiResponse {
  success: boolean;
  data?: AttendanceRecord;
  message?: string;
  error?: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
}

const AttendancePage: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState<boolean>(false);

  const markAttendance = async (token: string): Promise<ScanResult> => {
    try {
      const res: CheckinApiResponse = await apiClient.post('attendances/checkin', { token });

      if (res.success && res.data) {
        return { success: true, message: res.message || 'Asistencia registrada', record: res.data };
      }

      return { success: false, message: res.message || res.error || 'No se pudo registrar la asistencia' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Error de red' };
    }
  };

  const handleScan = async (qrData: string) => {
    if (!qrData || isScanning) return;

    setIsScanning(true);
    const scan = await markAttendance(qrData);
    setScanResult(scan);
    setIsScanning(false);
    setShowScanner(false);
  };

  const handleScannerError = (err: string) => {
    setScanResult({ success: false, message: `Error del escáner: ${err}` });
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Registro de Asistencia</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <p className="text-gray-700 mb-4">Escanea el código QR para registrar tu asistencia.</p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowScanner(true)}
              disabled={isScanning}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isScanning ? 'Procesando...' : 'Escanear con cámara'}
            </button>
          </div>
        </div>

        {scanResult && (
          <div className={`mt-4 p-4 rounded ${scanResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p className="font-semibold">{scanResult.message}</p>
            {scanResult.record && (
              <div className="mt-2 text-sm text-gray-700">
                <p>ID: {scanResult.record.id}</p>
                <p>Usuario: {scanResult.record.userId}</p>
                <p>Actividad: {scanResult.record.activityId}</p>
                <p>Fecha: {new Date(scanResult.record.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(result: string) => handleScan(result)}
        onError={(error: string) => handleScannerError(error)}
      />
    </div>
  );
};

export default AttendancePage;