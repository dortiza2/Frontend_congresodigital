import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error al cargar los datos',
  message = 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.',
  onRetry,
  onGoHome,
  showRetry = true,
  showGoHome = false,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border border-red-200 p-8 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6">{message}</p>
      <div className="flex justify-center space-x-3">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </button>
        )}
        {showGoHome && onGoHome && (
          <button
            onClick={onGoHome}
            className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors flex items-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al inicio
          </button>
        )}
      </div>
    </div>
  );
};

// Componente específico para errores de carga de datos
export const DataLoadError: React.FC<{
  dataType: string;
  onRetry?: () => void;
  className?: string;
}> = ({ dataType, onRetry, className = '' }) => {
  return (
    <ErrorState
      title={`Error al cargar ${dataType}`}
      message={`No se pudieron cargar los datos de ${dataType}. Verifica tu conexión a internet e intenta de nuevo.`}
      onRetry={onRetry}
      showRetry={!!onRetry}
      className={className}
    />
  );
};

// Componente para estado vacío (no es error, pero útil)
export const EmptyState: React.FC<{
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, message, actionLabel, onAction, icon, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-neutral-300 p-8 text-center ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};