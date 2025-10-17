'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const { user, loginEmail, loading } = useAuth();
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
      // Redirigir según el roleLevel del usuario
      const roleLevel = user.roleLevel || 0;
    if (roleLevel >= 2) {
        router.replace('/dashboard');
      } else {
        router.replace('/portal');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await loginEmail(formData.email, formData.password);
      
      if (user) {
        // Redirigir según el roleLevel
        const roleLevel = user.roleLevel || 0;
    if (roleLevel >= 2) {
          router.replace('/dashboard');
        } else {
          router.replace('/portal');
        }
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Mostrar loading si está verificando autenticación
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-congreso">
        <div className="overlay-soft pointer-events-none" />
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 relative z-10"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-congreso flex items-center justify-center px-4">
      <div className="overlay-soft pointer-events-none" />
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900/90 tracking-tight">
            Acceso al Dashboard
          </h2>
          <p className="mt-2 text-slate-700/90">
            Ingresa con tu cuenta de staff para acceder al panel de administración
          </p>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu.email@umg.edu.gt"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center px-4 py-3 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Acceder al Dashboard'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Link 
                href="/inscripcion" 
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                ¿Eres estudiante? Regístrate aquí
              </Link>
            </div>
            
            <div className="text-center">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>

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
      
      if (roleLevel >= 2) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          },
        };
      } else if (roleLevel >= 1) {
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