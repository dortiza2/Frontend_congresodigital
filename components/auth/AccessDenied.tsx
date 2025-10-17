import React from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showLoginButton?: boolean;
  showHomeButton?: boolean;
  onLoginClick?: () => void;
  onHomeClick?: () => void;
}

export function AccessDenied({
  title = 'Acceso Denegado',
  message = 'No tienes permisos para acceder a esta sección.',
  showLoginButton = true,
  showHomeButton = true,
  onLoginClick,
  onHomeClick
}: AccessDeniedProps) {
  const router = useRouter();

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      router.push('/inscripcion?next=' + encodeURIComponent(router.pathname));
    }
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      router.push('/');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>

            {showHomeButton && (
              <Button
                onClick={handleHomeClick}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Inicio
              </Button>
            )}

            {showLoginButton && (
              <Button
                onClick={handleLoginClick}
                className="flex items-center justify-center gap-2"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Si crees que deberías tener acceso a esta sección, contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;