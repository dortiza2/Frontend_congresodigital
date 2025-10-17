import React from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import AdminLayout from '../../components/admin/AdminLayout';
import CategoriesManager from '../../components/admin/CategoriesManager';
import { useCategories } from '../../hooks/useCategories';
import { RotateCcw, BarChart3, Settings } from 'lucide-react';

/**
 * POLÍTICA DE DATA FETCHING: Sin SSR/SSG
 * Esta página admin NO debe usar getServerSideProps, getStaticProps o getStaticPaths
 * para evitar conflictos. Toda obtención de datos debe realizarse en el cliente.
 */

export default function CategoriasPage() {
  const {
    categories,
    isLoading,
    updateCategories,
    resetToDefaults,
    getCategoryStats,
  } = useCategories();

  const stats = getCategoryStats();

  const handleResetToDefaults = () => {
    if (confirm('¿Estás seguro de que quieres resetear todas las categorías a los valores por defecto? Esta acción no se puede deshacer.')) {
      resetToDefaults();
    }
  };

  if (isLoading) {
    return (
        <AdminLayout title="Gestión de Categorías">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
    );
  }

  return (
      <AdminLayout title="Gestión de Categorías">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestión de Categorías
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Administra las categorías disponibles para los talleres
              </p>
            </div>
            <button
              onClick={handleResetToDefaults}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Resetear a Defecto</span>
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Categorías</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Por Defecto</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.default}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Personalizadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.custom}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Manager */}
          <CategoriesManager
            categories={categories}
            onCategoriesChange={updateCategories}
          />

          {/* Help Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              💡 Información sobre Categorías
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• Las categorías se utilizan para organizar y filtrar los talleres</p>
              <p>• Las categorías por defecto no se pueden eliminar, pero sí editar</p>
              <p>• Puedes crear categorías personalizadas con colores únicos</p>
              <p>• Los cambios se guardan automáticamente en el navegador</p>
              <p>• Usa "Resetear a Defecto" para restaurar las categorías originales</p>
            </div>
          </div>
        </div>
      </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions);
    
    // Verificar si hay sesión
    if (!session || !session.user) {
      return {
        redirect: {
          destination: '/inscripcion',
          permanent: false,
        },
      };
    }

    // Verificar rol de admin (roleLevel >= 3)
    const roleLevel = session.user.roleLevel || 0;
    
    if (roleLevel < 3) {
      return {
        redirect: {
          destination: '/inscripcion',
          permanent: false,
        },
      };
    }

    return {
      props: {
        session,
      },
    };
  } catch (error) {
    console.error('Error in admin/categorias getServerSideProps:', error);
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }
};