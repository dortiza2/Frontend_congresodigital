import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/RouteGuard';
import { ActivityManager } from '@/components/admin/ActivityManager';

function ActividadesPage() {
  return (
    <AdminLayout title="Gestión de Actividades">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Actividades</h1>
          <p className="text-gray-600 mt-1">
            Administra las actividades del congreso
          </p>
        </div>
        
        <ActivityManager />
      </div>
    </AdminLayout>
  );
}

// Exportar con protección de ruta
export default function ProtectedActividadesPage() {
  return (
    <AdminGuard>
      <ActividadesPage />
    </AdminGuard>
  );
}

export const getServerSideProps = async (ctx: any) => {
  const { getServerSession } = await import('next-auth/next');
  const { authOptions } = await import('../api/auth/[...nextauth]');
  
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);
    
    // Verificar si hay sesión
    if (!session || !session.user) {
      return {
        redirect: {
          destination: '/inscripcion?next=/admin/actividades',
          permanent: false,
        },
      };
    }

    // Verificar rol de Admin (roleLevel >= 2)
    const roleLevel = session.user.roleLevel || 0;
    if (roleLevel < 2) {
      // Si es estudiante autenticado, redirigir a su portal
      if (roleLevel >= 1) {
        return {
          redirect: {
            destination: '/mi-cuenta',
            permanent: false,
          },
        };
      }
      // Si no está autenticado, redirigir al login
      return {
        redirect: {
          destination: '/inscripcion?next=/admin/actividades',
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
    console.error('Error in admin/actividades getServerSideProps:', error);
    return {
      redirect: {
        destination: '/inscripcion?next=/admin/actividades',
        permanent: false,
      },
    };
  }
};