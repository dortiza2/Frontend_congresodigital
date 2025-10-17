import { useRoleAccess, RoleAccessOptions } from '@/hooks/useRoleAccess';
import { ReactNode } from 'react';

interface RoleGuardProps {
  requiredRole: string;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

export const RoleGuard = ({ 
  requiredRole, 
  children, 
  fallback = null,
  redirectTo = '/login',
  showAccessDenied = true
}: RoleGuardProps) => {
  const { hasAccess, isLoading } = useRoleAccess({
    requiredRole,
    redirectTo,
    showAccessDenied
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface StaffGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const StaffGuard = ({ children, fallback, redirectTo }: StaffGuardProps) => {
  return (
    <RoleGuard 
      requiredRole="STAFF" 
      fallback={fallback} 
      redirectTo={redirectTo}
    >
      {children}
    </RoleGuard>
  );
};

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const AdminGuard = ({ children, fallback, redirectTo }: AdminGuardProps) => {
  return (
    <RoleGuard 
      requiredRole="ADMIN" 
      fallback={fallback} 
      redirectTo={redirectTo}
    >
      {children}
    </RoleGuard>
  );
};

interface DevAdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const DevAdminGuard = ({ children, fallback, redirectTo }: DevAdminGuardProps) => {
  return (
    <RoleGuard 
      requiredRole="DVADMIN" 
      fallback={fallback} 
      redirectTo={redirectTo}
    >
      {children}
    </RoleGuard>
  );
};