'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';

export default function AdminLogin() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user && !loading) {
      const roleLevel = user.roleLevel || 0;
      const redirectTo = roleLevel >= 1 ? '/dashboard' : '/mi-cuenta';
      router.replace(redirectTo);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Usar NextAuth credentials para permitir backend real o fallback mock
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl: '/'
      });

      if (result && (result as { ok?: boolean }).ok) {
        // Obtener la sesión para decidir la redirección por rol
        const session = await getSession();
        const roleLevel = (session?.user as any)?.roleLevel || 0;
        const redirectTo = roleLevel >= 1 ? '/dashboard' : '/mi-cuenta';
        router.replace(redirectTo);
      } else if ((result as any)?.error) {
        setError('Credenciales inválidas o acceso denegado');
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-10 w-10 text-indigo-600" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Acceso Staff
            </h2>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa con tu correo y contraseña para acceder al dashboard
          </p>
          <div className="mt-4 text-center">
            <Link href="/inscripcion" className="inline-flex items-center text-indigo-600 hover:text-indigo-500">
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver a inicio de sesión
            </Link>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Correo</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Correo"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label="Mostrar/Ocultar contraseña"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>

        {/* Info adicional */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Esta página es exclusiva para miembros del staff del congreso.
            <br />
            Si tienes problemas para acceder, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = async (ctx: any) => {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('../api/auth/[...nextauth]');
  
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);
    
    // Si ya está autenticado, redirigir según su rol
    if (session && session.user) {
      const roleLevel = session.user.roleLevel || 0;
      
      if (roleLevel >= 1) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          },
        };
      } else {
        return {
          redirect: {
            destination: '/mi-cuenta',
            permanent: false,
          },
        };
      }
    }

    return { props: {} };
  } catch (error) {
    console.error('Error in admin/login getServerSideProps:', error);
    return { props: {} };
  }
};