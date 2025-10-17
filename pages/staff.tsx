import React from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useAuth } from '@/contexts/AuthContext';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, BookOpen, Award, QrCode, Download, Building2, AlertCircle } from 'lucide-react';
import { useStaffStats, type StaffStats } from '@/services/staffService';
import { useErrorHandler } from '@/lib/errorHandler';



function StaffContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const { stats, isLoading } = useStaffStats();

  const quickActions = [
    {
      title: 'Escanear QR',
      description: 'Registrar asistencia con código QR',
      icon: '📱',
      action: () => router.push('/staff/scan'),
      color: 'bg-blue-600'
    },
    {
      title: 'Marcar Asistencia',
      description: 'Registrar asistencia de participantes',
      icon: '✓',
      action: () => router.push('/asistencia'),
      color: 'bg-green-500'
    },
    {
      title: 'Ver Participantes',
      description: 'Lista de participantes inscritos',
      icon: '👥',
      action: () => router.push('/admin/participantes'),
      color: 'bg-blue-500'
    },
    {
      title: 'Actividades',
      description: 'Gestionar talleres y actividades',
      icon: '📅',
      action: () => router.push('/admin/talleres'),
      color: 'bg-purple-500'
    },
    {
      title: 'Mi Perfil',
      description: 'Actualizar información personal',
      icon: '👤',
      action: () => router.push('/portal/perfil'),
      color: 'bg-gray-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Panel de Staff
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Bienvenido/a {user?.name}, aquí puedes gestionar las tareas de asistencia.
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Staff
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.totalParticipants || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Staff Activo
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.totalActivities || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Invitaciones Pendientes
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.pendingTasks || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Invitaciones Aceptadas
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.todayAttendance || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 text-left"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-xl mb-4`}>
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Panel de Staff
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Como miembro del staff, tienes acceso a funciones de asistencia y gestión básica.
                  Para funciones administrativas avanzadas, contacta a un administrador.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  return <StaffContent />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Redirect unauthenticated users to login
  if (!session?.user) {
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }

  // Check staff role level (roleLevel >= 1 for staff access)
  const roleLevel = session.user.roleLevel || 0;
  if (roleLevel < 1) {
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};