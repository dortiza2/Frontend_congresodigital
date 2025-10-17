import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isLoggedIn } from '@/lib/authClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/inscripcion',
  fallback 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isLoggedIn();
      setIsAuthenticated(authenticated);
      setIsLoading(false);

      if (!authenticated) {
        // Construir URL de redirección con parámetro next
        const currentPath = router.asPath;
        const redirectUrl = `${redirectTo}?next=${encodeURIComponent(currentPath)}`;
        router.replace(redirectUrl);
      }
    };

    // Verificar autenticación cuando el componente se monta
    checkAuth();

    // Escuchar cambios en el router para re-verificar
    const handleRouteChange = () => {
      checkAuth();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, redirectTo]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || isAuthenticated === null) {
    return (
      fallback || (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      )
    );
  }

  // Si no está autenticado, no renderizar nada (ya se está redirigiendo)
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, renderizar el contenido
  return <>{children}</>;
}

// Hook personalizado para usar en páginas que necesiten verificar autenticación
export function useAuthGuard(redirectTo: string = '/inscripcion') {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isLoggedIn();
      setIsAuthenticated(authenticated);

      if (!authenticated) {
        const currentPath = router.asPath;
        const redirectUrl = `${redirectTo}?next=${encodeURIComponent(currentPath)}`;
        router.replace(redirectUrl);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  return isAuthenticated;
}