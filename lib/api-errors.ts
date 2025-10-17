/**
 * Business Error Mapping - Maps backend error codes to UI-friendly messages
 * Provides consistent error handling across the application
 */

import { ErrorUI } from '@/types/ui';

// Canonical error codes from backend (matching DomainExceptionFilter)
export type BusinessErrorCode = 
  | 'already_registered'
  | 'no_seats_left'
  | 'time_conflict'
  | 'email_not_found'
  | 'talk_requires_speaker'
  | 'invalid_argument'
  | 'duplicate_entry'
  | 'service_unavailable'
  | 'internal_server_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'network_error';

// Error mapping table
const ERROR_MAPPING: Record<BusinessErrorCode, Omit<ErrorUI, 'code' | 'correlationId'>> = {
  already_registered: {
    message: 'Ya estás inscrito en esta actividad',
    severity: 'warning',
    action: 'Revisa tu agenda de inscripciones'
  },
  no_seats_left: {
    message: 'No hay cupos disponibles para esta actividad',
    severity: 'error',
    action: 'Intenta inscribirte en otra actividad similar'
  },
  time_conflict: {
    message: 'Tienes un conflicto de horario con otra actividad',
    severity: 'warning',
    action: 'Revisa tu agenda y cancela otra inscripción si es necesario'
  },
  email_not_found: {
    message: 'El correo electrónico no está registrado',
    severity: 'error',
    action: 'Verifica tu correo o regístrate primero'
  },
  talk_requires_speaker: {
    message: 'Esta charla requiere asignación de ponente',
    severity: 'error',
    action: 'Contacta al administrador para más información'
  },
  invalid_argument: {
    message: 'Los datos proporcionados no son válidos',
    severity: 'error',
    action: 'Revisa la información e intenta nuevamente'
  },
  duplicate_entry: {
    message: 'Ya existe un registro con esta información',
    severity: 'warning',
    action: 'Verifica si ya completaste esta acción'
  },
  service_unavailable: {
    message: 'El servicio no está disponible temporalmente',
    severity: 'error',
    action: 'Intenta nuevamente en unos minutos'
  },
  internal_server_error: {
    message: 'Ocurrió un error interno del servidor',
    severity: 'error',
    action: 'Si el problema persiste, contacta al soporte técnico'
  },
  unauthorized: {
    message: 'No tienes autorización para realizar esta acción',
    severity: 'error',
    action: 'Inicia sesión o verifica tus permisos'
  },
  forbidden: {
    message: 'No tienes permisos suficientes para esta acción',
    severity: 'error',
    action: 'Contacta al administrador si necesitas acceso'
  },
  not_found: {
    message: 'El recurso solicitado no fue encontrado',
    severity: 'error',
    action: 'Verifica que la información sea correcta'
  },
  validation_error: {
    message: 'Los datos no cumplen con los requisitos',
    severity: 'warning',
    action: 'Revisa los campos marcados en rojo'
  },
  network_error: {
    message: 'Error de conexión de red',
    severity: 'error',
    action: 'Verifica tu conexión a internet e intenta nuevamente'
  }
};

/**
 * Maps a business error code to a user-friendly error object
 */
export function mapBusinessError(
  code: string, 
  correlationId?: string,
  customMessage?: string
): ErrorUI {
  const businessCode = code as BusinessErrorCode;
  const mapping = ERROR_MAPPING[businessCode];
  
  if (!mapping) {
    // Fallback for unknown error codes
    return {
      code,
      message: customMessage || 'Ocurrió un error inesperado',
      severity: 'error',
      action: 'Si el problema persiste, contacta al soporte técnico',
      correlationId
    };
  }
  
  return {
    code: businessCode,
    message: customMessage || mapping.message,
    severity: mapping.severity,
    action: mapping.action,
    correlationId
  };
}

/**
 * Maps HTTP status codes to business error codes
 */
export function mapHttpStatusToErrorCode(status: number): BusinessErrorCode {
  switch (status) {
    case 400:
      return 'invalid_argument';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'duplicate_entry';
    case 422:
      return 'validation_error';
    case 503:
      return 'service_unavailable';
    case 500:
    default:
      return 'internal_server_error';
  }
}

/**
 * Extracts error information from API response
 */
export function extractErrorFromResponse(response: any, status?: number): ErrorUI {
  // Try to extract error from response body
  if (response && typeof response === 'object') {
    const { code, message, correlationId } = response;
    
    if (code) {
      return mapBusinessError(code, correlationId, message);
    }
    
    if (message) {
      const errorCode = status ? mapHttpStatusToErrorCode(status) : 'internal_server_error';
      return mapBusinessError(errorCode, correlationId, message);
    }
  }
  
  // Fallback based on HTTP status
  if (status) {
    const errorCode = mapHttpStatusToErrorCode(status);
    return mapBusinessError(errorCode);
  }
  
  // Ultimate fallback
  return mapBusinessError('internal_server_error');
}

/**
 * Creates a network error for fetch failures
 */
export function createNetworkError(originalError?: Error): ErrorUI {
  return mapBusinessError('network_error', undefined, 
    originalError?.message || 'Error de conexión de red'
  );
}

/**
 * Validates if an error code is a known business error
 */
export function isKnownBusinessError(code: string): code is BusinessErrorCode {
  return code in ERROR_MAPPING;
}

/**
 * Gets all available error codes (useful for testing)
 */
export function getAllErrorCodes(): BusinessErrorCode[] {
  return Object.keys(ERROR_MAPPING) as BusinessErrorCode[];
}

/**
 * Creates a validation error for form fields
 */
export function createValidationError(fieldErrors: Record<string, string>): ErrorUI {
  const firstError = Object.values(fieldErrors)[0];
  return mapBusinessError('validation_error', undefined, firstError);
}