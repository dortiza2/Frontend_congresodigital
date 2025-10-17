import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyRole as checkAnyRole } from '@/lib/authClient';
import { 
  getStaffRoleDescription,
  getProfileDescription,
  STAFF_ROLES,
  type StaffRoleCode 
} from '@/lib/roleUtils';

// Definir los roles disponibles (usando las utilidades unificadas)
export type UserRole = StaffRoleCode;

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

// Función para verificar si el usuario tiene alguno de los roles permitidos
const hasAnyRole = (userRoles: string[], allowedRoles: UserRole[]): boolean => {
  return checkAnyRole(allowedRoles);
};

// Función para obtener el primer rol válido del usuario
const getFirstValidRole = (userRoles: string[]): UserRole | null => {
  // Simplificado: retorna el primer rol si existe
  return userRoles.length > 0 ? userRoles[0] as UserRole : null;
};

const RoleGate: React.FC<RoleGateProps> = ({ 
  children, 
  allowedRoles, 
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
  
  // Verificar si el usuario tiene alguno de los roles permitidos
  const userHasAccess = hasAnyRole(user.roles || [], allowedRoles);
  const userRole = getFirstValidRole(user.roles || []);
  
  // Si el usuario no tiene acceso
  if (!userHasAccess) {
    return (
      fallback || (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
          <div className="bg-white rounded-lg border border-neutral-300 p-8 text-center max-w-md">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No autorizado.</h2>
            <p className="text-slate-600 mb-2">
              No tienes permisos para acceder a esta página.
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Rol actual: {userRole ? getStaffRoleDescription(userRole) : 'Sin rol'} | Roles requeridos: {allowedRoles.map(role => getStaffRoleDescription(role)).join(', ')}
            </p>
            <a 
              href="/" 
              className="inline-block bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              Volver al Inicio
            </a>
          </div>
        </div>
      )
    );
  }
  
  // Si el usuario tiene el rol adecuado, mostrar el contenido
  return <>{children}</>;
};

export default RoleGate;
export { hasAnyRole, getFirstValidRole };