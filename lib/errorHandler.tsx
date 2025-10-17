/**
 * Sistema de notificaciones y manejo de errores global
 * 
 * Proporciona mensajes de error consistentes y notificaciones
 * para toda la aplicación con soporte para diferentes tipos de errores.
 */

import React from 'react';
import { toast } from 'sonner';

// ==================== TIPOS DE ERROR ====================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status?: number;
}

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

// ==================== CONFIGURACIÓN DE MENSAJES ====================

const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Error de conexión',
    message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
    description: 'El servidor no está disponible temporalmente.'
  },
  API_ERROR: {
    title: 'Error del servicio',
    message: 'Hubo un problema al procesar tu solicitud.',
    description: 'Por favor, intenta nuevamente más tarde.'
  },
  VALIDATION_ERROR: {
    title: 'Datos inválidos',
    message: 'Por favor, verifica la información ingresada.',
    description: 'Algunos campos requieren atención.'
  },
  AUTH_ERROR: {
    title: 'Error de autenticación',
    message: 'Tu sesión ha expirado o no tienes permisos.',
    description: 'Por favor, inicia sesión nuevamente.'
  },
  NOT_FOUND: {
    title: 'No encontrado',
    message: 'El recurso solicitado no existe.',
    description: 'Verifica que la dirección sea correcta.'
  },
  SERVER_ERROR: {
    title: 'Error del servidor',
    message: 'El servidor está experimentando problemas.',
    description: 'Estamos trabajando para resolverlo.'
  },
  UNKNOWN_ERROR: {
    title: 'Error desconocido',
    message: 'Ocurrió un error inesperado.',
    description: 'Por favor, intenta nuevamente.'
  }
};

const SUCCESS_MESSAGES = {
  DATA_LOADED: {
    title: 'Datos cargados',
    message: 'La información se ha cargado correctamente.'
  },
  OPERATION_COMPLETED: {
    title: 'Operación completada',
    message: 'La acción se realizó con éxito.'
  },
  CERTIFICATE_GENERATED: {
    title: 'Certificado generado',
    message: 'Tu certificado está listo para descargar.'
  },
  ENROLLMENT_COMPLETED: {
    title: 'Inscripción exitosa',
    message: 'Te has inscrito correctamente en la actividad.'
  }
};

// ==================== FUNCIONES DE UTILIDAD ====================

/**
 * Detecta el tipo de error basado en el objeto de error
 */
export function detectErrorType(error: unknown): ErrorType {
  if (!error) return 'UNKNOWN_ERROR';

  const err = error as Record<string, any> | undefined;

  // Errores de red
  if (err && (err.code === 'ECONNREFUSED' || err.code === 'NETWORK_ERROR')) {
    return 'NETWORK_ERROR';
  }
  
  // Errores HTTP
  if (err && typeof err.status === 'number') {
    switch (err.status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
      case 403:
        return 'AUTH_ERROR';
      case 404:
        return 'NOT_FOUND';
      case 500:
      case 502:
      case 503:
        return 'SERVER_ERROR';
      default:
        return 'API_ERROR';
    }
  }
  
  // Errores de JavaScript
  if (err && err.name === 'TypeError' && typeof err.message === 'string' && err.message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  
  // Mensajes de error específicos
  if (err && typeof err.message === 'string') {
    const message = err.message.toLowerCase();
    if (message.includes('network') || message.includes('conexión')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('autenticación') || message.includes('sesión')) {
      return 'AUTH_ERROR';
    }
    if (message.includes('no encontrado') || message.includes('not found')) {
      return 'NOT_FOUND';
    }
  }
  
  return 'UNKNOWN_ERROR';
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getUserFriendlyErrorMessage(error: unknown, context?: string): string {
  const errorType = detectErrorType(error);
  const errorConfig = ERROR_MESSAGES[errorType];
  
  // Si es un error de API con mensaje específico, usarlo
  const err = error as Record<string, any> | undefined;
  if (err?.message && errorType === 'API_ERROR') {
    return err.message as string;
  }
  
  // Mensaje contextualizado
  if (context) {
    return `${errorConfig.message} (${context})`;
  }
  
  return errorConfig.message;
}

/**
 * Muestra una notificación de error
 */
export function showErrorNotification(error: unknown, context?: string): void {
  const errorType = detectErrorType(error);
  const errorConfig = ERROR_MESSAGES[errorType];
  
  toast.error(errorConfig.title, {
    description: context ? `${errorConfig.message} (${context})` : errorConfig.message,
    duration: 5000,
    position: 'top-center'
  });
}

/**
 * Muestra una notificación de éxito
 */
export function showSuccessNotification(type: keyof typeof SUCCESS_MESSAGES, customMessage?: string): void {
  const successConfig = SUCCESS_MESSAGES[type];
  
  toast.success(successConfig.title, {
    description: customMessage || successConfig.message,
    duration: 3000,
    position: 'top-center'
  });
}

/**
 * Muestra una notificación informativa
 */
export function showInfoNotification(title: string, message?: string): void {
  toast.info(title, {
    description: message,
    duration: 4000,
    position: 'top-center'
  });
}

/**
 * Muestra una notificación de advertencia
 */
export function showWarningNotification(title: string, message?: string): void {
  toast.warning(title, {
    description: message,
    duration: 4000,
    position: 'top-center'
  });
}

/**
 * Maneja errores de API de forma centralizada
 */
export function handleApiError(error: unknown, context?: string): { success: false; error: ApiError } {
  const errorType = detectErrorType(error);
  let apiError: ApiError = {
    code: errorType,
    message: getUserFriendlyErrorMessage(error, context)
  };

  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.code === 'string') apiError.code = errObj.code;
    if (typeof errObj.message === 'string') apiError.message = errObj.message;
    if (typeof errObj.status === 'number') apiError.status = errObj.status;
    if (Object.prototype.hasOwnProperty.call(errObj, 'details')) {
      apiError.details = (errObj as { details?: unknown }).details;
    }
  }

  return { success: false, error: apiError };
}

/**
 * Maneja errores de carga de datos (para SSR/CSR)
 */
export function handleDataLoadError<T>(error: unknown, dataType: string): { data: T[]; error: boolean; message: string } {
  const errorType = detectErrorType(error);
  const message = getUserFriendlyErrorMessage(error, `Carga de ${dataType}`);
  return {
    data: [],
    error: errorType !== 'UNKNOWN_ERROR',
    message,
  };
}

/**
 * Crea un banner de error para mostrar en la UI
 */
export function createErrorBanner(error: unknown, context?: string): React.ReactNode {
  const errorType = detectErrorType(error);
  const errorConfig = ERROR_MESSAGES[errorType];
  const message = getUserFriendlyErrorMessage(error, context);
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md" role="alert">
      <div className="flex">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-9.293a1 1 0 011.414 0L11 8.586l.293-.293a1 1 0 111.414 1.414L12.414 10l.293.293a1 1 0 01-1.414 1.414L11 11.414l-.293.293a1 1 0 01-1.414-1.414L9.586 10l-.293-.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{errorConfig.title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Crea un banner informativo para cuando no hay datos
 */
export function createNoDataBanner(message?: string): React.ReactNode {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">Sin datos disponibles</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>{message || 'No hay información para mostrar en este momento.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== HOOK PARA MANEJO DE ERRORES ====================

/**
 * Hook personalizado para manejo de errores
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    return handleApiError(error, context);
  };
  
  const handleDataError = (error: any, dataType: string) => {
    return handleDataLoadError(error, dataType);
  };
  
  return {
    handleError,
    handleDataError,
    showError: showErrorNotification,
    showSuccess: showSuccessNotification,
    showInfo: showInfoNotification,
    showWarning: showWarningNotification,
    createErrorBanner,
    createNoDataBanner,
    getErrorMessage: getUserFriendlyErrorMessage
  };
}

// ==================== EXPORT DEFAULT ====================

export default {
  detectErrorType,
  getUserFriendlyErrorMessage,
  showErrorNotification,
  showSuccessNotification,
  showInfoNotification,
  showWarningNotification,
  handleApiError,
  handleDataLoadError,
  createErrorBanner,
  createNoDataBanner,
  useErrorHandler
};

// ==================== SSR Logging Helper ====================
export function logSsrError(endpoint: string, error: unknown): void {
  const ts = new Date().toISOString();
  const err = typeof error === 'object' && error !== null
    ? (error as { message?: string; status?: unknown; code?: unknown })
    : undefined;
  const message = typeof error === 'string' ? error : (err?.message || 'SSR error');
  const status = (err?.status as string | number | undefined) ?? (err?.code as string | number | undefined) ?? 'unknown';
  // Prefer console.error for SSR visibility
  // Include endpoint and timestamp for quick diagnostics
  // Avoid throwing to not break ISR
  // eslint-disable-next-line no-console
  console.error(`[SSR:${ts}] endpoint=${endpoint} status=${status} message=${message}`);
}