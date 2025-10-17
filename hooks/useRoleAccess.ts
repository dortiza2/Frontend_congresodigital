import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export interface RoleAccessOptions {
  requiredRole?: string;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

export interface RoleAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  userRole?: string;
  roleLevel?: number;
}

const ROLE_HIERARCHY = {
  USER: 0,
  STAFF: 1,
  ADMIN: 2,
  DVADMIN: 3
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

export const useRoleAccess = (options: RoleAccessOptions = {}): RoleAccessResult => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const {
    requiredRole = 'USER',
    redirectTo = '/login',
    showAccessDenied = true
  } = options;

  const userRoles = user?.roles || [];
  const userRoleLevel = user?.roleLevel ?? ROLE_HIERARCHY.USER;
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole as UserRole];

  const hasAccess = userRoleLevel >= requiredRoleLevel;

  useEffect(() => {
    if (!loading && !user && redirectTo) {
      router.push(redirectTo);
      return;
    }

    if (!loading && user && !hasAccess && redirectTo) {
      if (showAccessDenied) {
        router.push({
          pathname: redirectTo,
          query: { accessDenied: 'true', message: 'Acceso denegado' }
        });
      } else {
        router.push(redirectTo);
      }
    }
  }, [user, loading, hasAccess, redirectTo, showAccessDenied]);

  return {
    hasAccess,
    isLoading: loading,
    userRole: userRoles[0] || 'USER',
    roleLevel: userRoleLevel
  };
};

export const useStaffAccess = (redirectTo?: string) => {
  return useRoleAccess({
    requiredRole: 'STAFF',
    redirectTo: redirectTo || '/login',
    showAccessDenied: true
  });
};

export const useAdminAccess = (redirectTo?: string) => {
  return useRoleAccess({
    requiredRole: 'ADMIN',
    redirectTo: redirectTo || '/login',
    showAccessDenied: true
  });
};

export const useDevAdminAccess = (redirectTo?: string) => {
  return useRoleAccess({
    requiredRole: 'DVADMIN',
    redirectTo: redirectTo || '/login',
    showAccessDenied: true
  });
};

export const getRoleLevel = (role: string): number => {
  return ROLE_HIERARCHY[role as UserRole] ?? 0;
};

export const hasRolePermission = (userRole: string, requiredRole: string): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};