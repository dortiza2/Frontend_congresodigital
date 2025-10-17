'use client';

import { useRouter } from 'next/router';
import { Shield, ArrowLeft, Home } from 'lucide-react';

interface ForbiddenPageProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function ForbiddenPage({
  title = "Acceso Denegado",
  message = "No tienes permisos para acceder a esta página.",
  showBackButton = true,
  showHomeButton = true
}: ForbiddenPageProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono */}
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-8">
          <Shield className="w-12 h-12 text-red-600" />
        </div>

        {/* Código de error */}
        <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>

        {/* Título */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {title}
        </h2>

        {/* Mensaje */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>

        {/* Botones de acción */}
        <div className="space-y-3">
          {showHomeButton && (
            <button
              onClick={handleGoHome}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Ir al Dashboard
            </button>
          )}

          {showBackButton && (
            <button
              onClick={handleGoBack}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver Atrás
            </button>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-red-200">
          <p className="text-sm text-gray-600">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente específico para errores de permisos de staff
export function StaffForbidden() {
  return (
    <ForbiddenPage
      title="Acceso Restringido"
      message="Esta página está disponible solo para miembros del staff del congreso."
    />
  );
}

// Componente específico para errores de permisos de admin
export function AdminForbidden() {
  return (
    <ForbiddenPage
      title="Acceso de Administrador Requerido"
      message="Esta página requiere permisos de administrador para acceder."
    />
  );
}

// Componente específico para roles específicos
export function RoleForbidden({ requiredRoles }: { requiredRoles: string[] }) {
  return (
    <ForbiddenPage
      title="Permisos Insuficientes"
      message={`Esta página requiere uno de los siguientes roles: ${requiredRoles.join(', ')}.`}
    />
  );
}

// Componente específico para niveles de rol
export function RoleLevelForbidden({ 
  currentLevel, 
  requiredLevel 
}: { 
  currentLevel: number; 
  requiredLevel: number; 
}) {
  const getRoleLevelDescription = (level: number): string => {
    switch (level) {
      case 3: return 'DevAdmin';
      case 2: return 'Admin';
      case 1: return 'Asistente';
      default: return 'Sin rol';
    }
  };

  return (
    <ForbiddenPage
      title="Nivel de Acceso Insuficiente"
      message={`Tu nivel actual es ${getRoleLevelDescription(currentLevel)} (Nivel ${currentLevel}). Esta página requiere ${getRoleLevelDescription(requiredLevel)} (Nivel ${requiredLevel}) o superior.`}
    />
  );
}