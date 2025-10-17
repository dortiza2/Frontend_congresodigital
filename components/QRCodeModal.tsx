import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, Check } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: number;
  activityTitle: string;
  userEmail: string;
  qrToken?: string; // Add QR token prop
}

export default function QRCodeModal({ 
  isOpen, 
  onClose, 
  enrollmentId, 
  activityTitle, 
  userEmail,
  qrToken 
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;
  
  // Use the actual QR token if available, otherwise fallback to JSON data
  const qrData = qrToken || JSON.stringify({
    enrollmentId,
    userEmail,
    activityTitle,
    timestamp: new Date().toISOString()
  });
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };
  
  const handleDownload = () => {
    const canvas = document.querySelector('#qr-code-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${activityTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Código QR de Asistencia</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Activity Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">{activityTitle}</h4>
          <p className="text-sm text-gray-600">ID de Inscripción: {enrollmentId}</p>
        </div>
        
        {/* QR Code */}
        <div className="flex justify-center mb-4" id="qr-code-canvas">
          <QRCodeSVG 
            value={qrData}
            size={200}
            level="M"
            includeMargin={true}
          />
        </div>
        
        {/* Instructions */}
        <p className="text-sm text-gray-600 text-center mb-4">
          Presenta este código QR al personal del evento para confirmar tu asistencia.
        </p>
        
        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Datos
              </>
            )}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}