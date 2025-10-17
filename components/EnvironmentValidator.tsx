'use client';

import { useEffect, useState } from 'react';
import { validateApiBaseUrl } from '@/lib/api';

interface EnvironmentValidatorProps {
  children: React.ReactNode;
}

interface ValidationError {
  type: 'api_config' | 'network' | 'unknown';
  message: string;
  details?: string;
}

export default function EnvironmentValidator({ children }: EnvironmentValidatorProps) {
  const [error, setError] = useState<ValidationError | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const validateEnvironment = async () => {
      try {
        // Intentar health detallado; si falla, intentar /health simple
        let response: Response | null = null;
        try {
          response = await fetch('/api/health', {
            headers: { 'Accept': 'application/json' },
            credentials: 'include',
          });
        } catch (e) {
          response = null;
        }

        // Si existiese un endpoint alternativo, se podría intentar aquí
        if (!response || !response.ok) {
          throw new Error('API health check failed: /api/health');
        }

        if (!response.ok) {
          throw new Error(`API health check failed: ${response.status} ${response.statusText}`);
        }

        const healthData = await response.json();
        const rawStatus = String(healthData.status || healthData.message || '').toLowerCase();
        const isHealthy = rawStatus.includes('healthy') || rawStatus === 'ok' || rawStatus === 'up';
        if (!isHealthy) {
          throw new Error('API health check reported unhealthy status');
        }

        console.log('✅ Environment validation passed:', {
          endpoint: response.url,
          status: healthData.status,
          apiVersion: healthData.version,
          apiTime: healthData.time,
          timestamp: new Date().toISOString(),
        });

        setError(null);
      } catch (err) {
        console.error('❌ Environment validation failed:', err);

        let validationError: ValidationError;
        if (err instanceof Error) {
          if (err.message.includes('NEXT_PUBLIC_API_URL')) {
            validationError = {
              type: 'api_config',
              message: 'Configuración de API inválida',
              details: err.message,
            };
          } else if (err.message.includes('health check failed') || err.message.includes('fetch')) {
            validationError = {
              type: 'network',
              message: 'No se puede conectar con la API',
              details: err.message,
            };
          } else {
            validationError = {
              type: 'unknown',
              message: 'Error de validación del entorno',
              details: err.message,
            };
          }
        } else {
          validationError = {
            type: 'unknown',
            message: 'Error desconocido de validación',
            details: String(err),
          };
        }

        setError(validationError);
      }
    };

    validateEnvironment();
  }, []);

  // Render children siempre; si hay error, mostrar banner superior no intrusivo
  return (
    <>
      {!dismissed && error && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.938 20h14.124c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 17.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium text-red-800">
                    {error.type === 'api_config' ? 'Configuración de API inválida' : 'Error de conexión con la API'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              {error.details && (
                <div className="mt-2 text-xs text-red-700 break-all">
                  {error.details}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}