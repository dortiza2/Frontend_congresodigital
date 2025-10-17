import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Configuración de rutas y roles
const PROTECTED_ROUTES = {
  // Rutas que requieren autenticación básica
  AUTH_REQUIRED: ['/mi-cuenta', '/portal', '/inscripcion/completar'],
  
  // Rutas que requieren rol de staff (roleLevel >= 2)
  STAFF_REQUIRED: ['/dashboard', '/admin', '/staff'],
  
  // Rutas que requieren rol específico de admin
  ADMIN_REQUIRED: ['/admin/usuarios', '/admin/configuracion'],
  
  // Rutas públicas (no requieren autenticación)
  PUBLIC: ['/', '/inscripcion', '/faq', '/actividades', '/agenda', '/ganadores', '/podio', '/api/auth']
};

// Rutas de redirección por rol
const REDIRECT_ROUTES = {
  LOGIN: '/inscripcion',
  STUDENT_DASHBOARD: '/mi-cuenta',
  STAFF_DASHBOARD: '/dashboard',
  FORBIDDEN: '/403'
};

function matchesRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => pathname === pattern || pathname.startsWith(pattern + '/'));
}

/**
 * Determina si una ruta es pública
 */
function isPublicRoute(pathname: string): boolean {
  return matchesRoute(pathname, PROTECTED_ROUTES.PUBLIC);
}

/**
 * Obtiene el nivel de rol del usuario
 */
function getUserRoleLevel(token: any): number {
  if (!token) return 0;

  // Preferir roleLevel del token
  if (typeof token.roleLevel === 'number') {
    return token.roleLevel;
  }

  // Buscar roleLevel dentro de backendData si existe
  if (token.backendData?.user?.roleLevel) {
    return token.backendData.user.roleLevel;
  }

  // Derivar por roles en caso de no tener roleLevel
  const roles: string[] = (token.roles || token.backendData?.user?.roles || []).map((r: string) => r.toLowerCase());
  if (roles.includes('mgadmin') || roles.includes('devadmin')) return 3; // DevAdmin
  if (roles.includes('admin')) return 2; // Admin
  if (roles.includes('asistente') || roles.includes('assistant') || roles.includes('staff')) return 1; // Staff

  // Usuario autenticado sin rol especial
  return 0;
}

function getRedirectByRole(roleLevel: number): string {
  if (roleLevel >= 2) return REDIRECT_ROUTES.STAFF_DASHBOARD;
  if (roleLevel === 1) return REDIRECT_ROUTES.STAFF_DASHBOARD;
  return REDIRECT_ROUTES.STUDENT_DASHBOARD;
}

/**
 * Middleware principal de Next.js
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir archivos estáticos y API de NextAuth
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  try {
    // Obtener token de NextAuth
    const token = await getToken({
      req: request as any, // Workaround para compatibilidad de tipos NextAuth
      secret: process.env.NEXTAUTH_SECRET,
    });

    const roleLevel = getUserRoleLevel(token);
    const isAuthenticated = !!token;

    // Log para debugging solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] ${pathname} - Auth: ${isAuthenticated}, Role: ${roleLevel}`);
    }

    // Rutas públicas - permitir acceso
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Verificar si requiere autenticación básica
    if (matchesRoute(pathname, PROTECTED_ROUTES.AUTH_REQUIRED)) {
      if (!isAuthenticated) {
        const loginUrl = new URL(REDIRECT_ROUTES.LOGIN, request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Verificar si requiere rol de admin
    if (matchesRoute(pathname, PROTECTED_ROUTES.ADMIN_REQUIRED)) {
      if (!isAuthenticated) {
        const loginUrl = new URL(REDIRECT_ROUTES.LOGIN, request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (roleLevel < 2) { // Admin requiere nivel 2+
        return NextResponse.redirect(new URL(REDIRECT_ROUTES.FORBIDDEN, request.url));
      }
    }

    // Verificar si requiere rol de staff
    if (matchesRoute(pathname, PROTECTED_ROUTES.STAFF_REQUIRED)) {
      if (!isAuthenticated) {
        const loginUrl = new URL(REDIRECT_ROUTES.LOGIN, request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (roleLevel < 1) { // Staff requiere nivel 1+
        return NextResponse.redirect(new URL(REDIRECT_ROUTES.FORBIDDEN, request.url));
      }
    }

    // Redirecciones inteligentes para rutas raíz según rol
    if (pathname === '/') {
      if (isAuthenticated) {
        const redirectTo = getRedirectByRole(roleLevel);
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    // Evitar que staff acceda a rutas de estudiante
    if (pathname.startsWith('/portal') && roleLevel >= 2) {
      return NextResponse.redirect(new URL(REDIRECT_ROUTES.STAFF_DASHBOARD, request.url));
    }

    // Evitar que estudiantes accedan a rutas de staff
    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && roleLevel < 2) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL(REDIRECT_ROUTES.STUDENT_DASHBOARD, request.url));
      } else {
        const loginUrl = new URL(REDIRECT_ROUTES.LOGIN, request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();

  } catch (error) {
    // Log de error solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('[Middleware] Error:', error);
    }
    // En caso de error, redirigir al login por seguridad
    return NextResponse.redirect(new URL(REDIRECT_ROUTES.LOGIN, request.url));
  }
}

// Configuración de rutas donde aplicar el middleware
export const config = {
  matcher: [
    /*
     * Aplicar a todas las rutas excepto:
     * - api routes (excepto /api/auth)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos con extensión
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};