'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import ForbiddenPage, { StaffForbidden, AdminForbidden, RoleForbidden } from '@/components/ui/forbidden';

// Helper para validar dominios permitidos (mismo que en AuthContext)
const isAllowedDomain = (email: string): boolean => {
  const allowedDomains = ['umg.edu.gt', 'miumg.edu.gt'];
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};
import { isLoggedIn } from '@/lib/authClient';
import { 
  canAccessRoute, 
  getDefaultRouteByProfile, 
  isStaff, 
  isAdmin, 
  STAFF_ROLES,
  type UserProfile 
} from '@/lib/roleUtils';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireStaff?: boolean;
  requireAdmin?: boolean;
  requiredStaffRoles?: string[];
  fallbackPath?: string;
  showForbiddenPage?: boolean;
}

export default function RouteGuard({ 
  children, 
  requireAuth = false, 
  requireStaff = false,
  requireAdmin = false,
  requiredStaffRoles = [], 
  fallbackPath = '/inscripcion',
  showForbiddenPage = false
}: RouteGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [forbiddenType, setForbiddenType] = useState<'auth' | 'staff' | 'admin' | 'role' | null>(null);

  // Definir rutas permitidas para estudiantes y zonas de staff
  const STUDENT_ALLOWED = [
    '/', '/inscripcion', '/mi-cuenta', '/faq', '/actividades', '/agenda', '/ganadores', '/podio'
  ];
  
  const STAFF_ZONES = ['/admin', '/dashboard', '/portal', '/staff'];

  useEffect(() => {
    // Función para verificar autorización
    const checkAuth = () => {
      const currentPath = router.pathname; // Usar pathname en lugar de asPath para evitar query params
      
      // CRÍTICO: Si está cargando la sesión, NO renderizar nada
      if (loading) {
        setAuthorized(false);
        return;
      }

      // Si no requiere autenticación, permitir acceso
      if (!requireAuth && !requireStaff && !requireAdmin && requiredStaffRoles.length === 0) {
        setAuthorized(true);
        return;
      }

      // Verificar si está logueado
      if (!isLoggedIn() || !user) {
        console.log('[RouteGuard] Usuario no autenticado');
        if (showForbiddenPage) {
          setForbiddenType('auth');
          setAuthorized(false);
          return;
        } else {
          const loginUrl = `/inscripcion${currentPath !== '/' ? `?next=${encodeURIComponent(currentPath)}` : ''}`;
          // Evitar redirección si ya estamos en la página de login
          if (currentPath !== '/inscripcion') {
            router.replace(loginUrl);
          }
          setAuthorized(false);
          return;
        }
      }

      // Convertir user a UserProfile para compatibilidad
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        fullName: user.name || user.email,
        profileType: user.profileType || 'student',
        staffRole: user.staffRole,
        roleLevel: user.roleLevel || 0,
        isUmg: user.email ? isAllowedDomain(user.email) : false,
        orgName: user.organization
      };

      const roleLevel = userProfile.roleLevel || 0;

      // V2: Lógica estricta para estudiantes (roleLevel 0)
      if (roleLevel === 0) {
        // Verificar si intenta acceder a zona staff
        const isAccessingStaffZone = STAFF_ZONES.some(zone => currentPath.startsWith(zone));
        
        if (isAccessingStaffZone) {
          // Redirigir a /mi-cuenta SOLO si no está ya ahí (evitar loops)
          if (currentPath !== '/mi-cuenta') {
            console.log('[RouteGuard] Estudiante intentando acceder a zona staff, redirigiendo a /mi-cuenta');
            router.replace('/mi-cuenta');
            setAuthorized(false);
            return;
          }
        }
        
        // Si está en ruta permitida, autorizar
        if (STUDENT_ALLOWED.includes(currentPath) || currentPath.startsWith('/actividades/') || currentPath.startsWith('/agenda/')) {
          setAuthorized(true);
          return;
        }
        
        // Si no está en ruta permitida y no es zona staff, redirigir a /mi-cuenta
        if (currentPath !== '/mi-cuenta') {
          console.log('[RouteGuard] Estudiante en ruta no permitida, redirigiendo a /mi-cuenta');
          router.replace('/mi-cuenta');
          setAuthorized(false);
          return;
        }
      }

      // Para staff (>=1), NO redirigir si ya está en /inscripcion o /mi-cuenta
      if (roleLevel >= 1 && (currentPath === '/inscripcion' || currentPath === '/mi-cuenta')) {
        setAuthorized(true);
        return;
      }

      // Verificar acceso a la ruta específica usando las nuevas reglas
      if (!canAccessRoute(userProfile, currentPath)) {
        console.log(`[RouteGuard] Usuario sin permisos para ${currentPath}`);
        if (showForbiddenPage) {
          setForbiddenType('auth');
          setAuthorized(false);
          return;
        } else {
          const defaultRoute = getDefaultRouteByProfile(userProfile);
          // Evitar loops: solo redirigir si la ruta destino es diferente
          if (currentPath !== defaultRoute) {
            console.log(`[RouteGuard] Redirigiendo de ${currentPath} a ${defaultRoute}`);
            router.replace(defaultRoute);
          }
          setAuthorized(false);
          return;
        }
      }

      // Verificar si requiere staff
      if (requireStaff && !isStaff(userProfile)) {
        console.log('[RouteGuard] Ruta requiere staff, usuario no es staff');
        if (showForbiddenPage) {
          setForbiddenType('staff');
          setAuthorized(false);
          return;
        } else {
          const defaultRoute = getDefaultRouteByProfile(userProfile);
          router.replace(defaultRoute);
          setAuthorized(false);
          return;
        }
      }

      // Verificar si requiere admin
      if (requireAdmin && !isAdmin(userProfile)) {
        console.log('[RouteGuard] Ruta requiere admin, usuario no es admin');
        if (showForbiddenPage) {
          setForbiddenType('admin');
          setAuthorized(false);
          return;
        } else {
          const defaultRoute = getDefaultRouteByProfile(userProfile);
          router.replace(defaultRoute);
          setAuthorized(false);
          return;
        }
      }

      // Verificar staff roles específicos si son requeridos
      if (requiredStaffRoles.length > 0) {
        const hasRequiredRole = userProfile.profileType === 'staff' && 
                               userProfile.staffRole && 
                               requiredStaffRoles.includes(userProfile.staffRole);
        
        if (!hasRequiredRole) {
          console.log(`[RouteGuard] Usuario sin staff role requerido para ${currentPath}, roles requeridos: ${requiredStaffRoles.join(', ')}, staff role del usuario: ${userProfile.staffRole || 'ninguno'}`);
          if (showForbiddenPage) {
            setForbiddenType('role');
            setAuthorized(false);
            return;
          } else {
            const defaultRoute = getDefaultRouteByProfile(userProfile);
            router.replace(defaultRoute);
            setAuthorized(false);
            return;
          }
        }
      }

      // Si llegamos aquí, el usuario está autorizado
      setAuthorized(true);
    };

    // Ejecutar verificación
    checkAuth();
  }, [loading, user?.roleLevel, router.pathname]);

  // CRÍTICO: Mientras loading === true, NO renderizar nada (evitar flicker)
  if (loading) {
    return null;
  }

  // Mostrar página 403 si está habilitada y hay un error de permisos
  if (forbiddenType && showForbiddenPage) {
    switch (forbiddenType) {
      case 'staff':
        return <StaffForbidden />;
      case 'admin':
        return <AdminForbidden />;
      case 'role':
        return <RoleForbidden requiredRoles={requiredStaffRoles} />;
      case 'auth':
      default:
        return <ForbiddenPage />;
    }
  }

  // Mostrar contenido solo si está autorizado
  return authorized ? <>{children}</> : null;
}

// HOC para proteger páginas específicas
export function withRouteGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardOptions: Omit<RouteGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <RouteGuard {...guardOptions}>
        <WrappedComponent {...props} />
      </RouteGuard>
    );
  };
}

// Componentes específicos para diferentes tipos de protección
export const DashboardGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[DashboardGuard] Protegiendo ruta dashboard - requiere roleLevel >= 1');
  
  // Usar el nuevo RoleLevelGate en lugar de RouteGuard
  const RoleLevelGate = require('./RoleLevelGate').default;
  
  return (
    <RoleLevelGate minRoleLevel={1}>
      {children}
    </RoleLevelGate>
  );
};

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AuthGuard] Protegiendo ruta - solo requiere autenticación');
  return (
    <RouteGuard 
      requireAuth={true}
      fallbackPath="/login"
    >
      {children}
    </RouteGuard>
  );
};

// Guard específico para rutas de staff
export const StaffGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[StaffGuard] Protegiendo ruta staff');
  
  return (
    <RouteGuard 
      requireStaff={true}
      fallbackPath="/dashboard"
      showForbiddenPage={true}
    >
      {children}
    </RouteGuard>
  );
};

// Guard específico para rutas de administración (niveles 2 y 3)
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AdminGuard] Protegiendo ruta admin - requiere roleLevel >= 2');
  
  // Usar el nuevo RoleLevelGate en lugar de RouteGuard
  const RoleLevelGate = require('./RoleLevelGate').default;
  
  return (
    <RoleLevelGate minRoleLevel={2}>
      {children}
    </RoleLevelGate>
  );
};

// Guard específico para rutas que requieren SOLO DevAdmin (nivel 3)
export const DevAdminOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[DevAdminOnlyGuard] Protegiendo ruta - requiere roleLevel = 3 (solo DevAdmin)');
  
  // Usar el nuevo RoleLevelGate en lugar de RouteGuard
  const RoleLevelGate = require('./RoleLevelGate').default;
  
  return (
    <RoleLevelGate minRoleLevel={3}>
      {children}
    </RoleLevelGate>
  );
};

// Guard específico para asistentes
export const AssistantGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AssistantGuard] Protegiendo ruta para asistentes');
  
  return (
    <RouteGuard 
      requiredStaffRoles={[STAFF_ROLES.ASISTENTE, STAFF_ROLES.ADMIN, STAFF_ROLES.ADMIN_DEV]}
      fallbackPath="/dashboard"
      showForbiddenPage={true}
    >
      {children}
    </RouteGuard>
  );
};

// Guard específico para DevAdmin (nivel 3)
export const DevAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[DevAdminGuard] Protegiendo ruta devadmin - requiere roleLevel >= 3');
  
  // Usar el nuevo RoleLevelGate en lugar de RouteGuard
  const RoleLevelGate = require('./RoleLevelGate').default;
  
  return (
    <RoleLevelGate minRoleLevel={3}>
      {children}
    </RoleLevelGate>
  );
};

// Guard para el portal de estudiantes - requiere autenticación pero no staff
export const PortalGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard 
      requireAuth={true}
      fallbackPath="/login"
    >
      {children}
    </RouteGuard>
  );
};