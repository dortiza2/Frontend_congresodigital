import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleLevelForbidden } from '@/components/ui/forbidden';

interface RoleLevelGateProps {
  children: React.ReactNode;
  minRoleLevel: number; // Nivel mínimo requerido (1=Asistente, 2=Admin, 3=DevAdmin)
  maxRoleLevel?: number; // Nivel máximo permitido (opcional)
  fallback?: React.ReactNode;
}

const getRoleLevelDescription = (level: number): string => {
  switch (level) {
    case 3: return 'DevAdmin';
    case 2: return 'Admin';
    case 1: return 'Asistente';
    default: return 'Sin rol';
  }
};

const RoleLevelGate: React.FC<RoleLevelGateProps> = ({ 
  children, 
  minRoleLevel, 
  maxRoleLevel,
  fallback 
}) => {
  const { user } = useAuth();
  
  // Si no hay usuario autenticado
  if (!user) {
    return (
      fallback || (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
          <div className="bg-white rounded-lg border border-neutral-300 p-8 text-center max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Acceso Denegado</h2>
            <p className="text-slate-600 mb-4">Debes iniciar sesión para acceder a esta página.</p>
            <a 
              href="/inscripcion" 
              className="inline-block bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      )
    );
  }
  
  const userRoleLevel = user.roleLevel || 0;
  
  // Verificar si el usuario tiene el nivel mínimo requerido
  if (userRoleLevel < minRoleLevel) {
    return (
      fallback || (
        <RoleLevelForbidden 
          currentLevel={userRoleLevel} 
          requiredLevel={minRoleLevel} 
        />
      )
    );
  }

  // Verificar si el usuario excede el nivel máximo permitido
  if (maxRoleLevel !== undefined && userRoleLevel > maxRoleLevel) {
    return (
      fallback || (
        <RoleLevelForbidden 
          currentLevel={userRoleLevel} 
          requiredLevel={maxRoleLevel}
          message="Nivel de rol demasiado alto para acceder a esta página"
        />
      )
    );
  }
  
  // Si el usuario tiene el nivel adecuado, mostrar el contenido
  return <>{children}</>;
};

export default RoleLevelGate;