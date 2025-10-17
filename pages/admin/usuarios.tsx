import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DevAdminGuard } from '@/components/RouteGuard';
import { UserTable } from '@/components/admin/UserTable';

function UsuariosPage() {
  return (
    <AdminLayout title="Gestión de Usuarios">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema (solo MEGAADMIN)
          </p>
        </div>
        
        <UserTable />
      </div>
    </AdminLayout>
  );
}

// Exportar con protección de ruta
export default function ProtectedUsuariosPage() {
  return <UsuariosPage />;
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
          destination: '/inscripcion?next=/admin/usuarios',
          permanent: false,
        },
      };
    }

    // Verificar rol de DevAdmin (roleLevel >= 3)
    const roleLevel = session.user.roleLevel || 0;
    if (roleLevel < 3) {
      // Si es staff pero no DevAdmin, redirigir al dashboard
      if (roleLevel >= 2) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          },
        };
      }
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
          destination: '/inscripcion?next=/admin/usuarios',
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
    console.error('Error in admin/usuarios getServerSideProps:', error);
    return {
      redirect: {
        destination: '/inscripcion?next=/admin/usuarios',
        permanent: false,
      },
    };
  }
};