import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Users, BarChart3, Calendar, UserCheck, Settings, Tags, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole } from '@/lib/roleUtils';

export default function Sidebar() {
  const router = useRouter();
  const { user } = useAuth();

  // Obtener roles del usuario para mostrar items condicionalmente
  const userRoles = user?.roles || [];
  const isMegaAdmin = hasRole(userRoles, 'MGADMIN');
  const isDevAdmin = hasRole(userRoles, 'DVADMIN');

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3,
      current: router.pathname === '/admin'
    },
    {
      name: 'Asistencia',
      href: '/admin/asistencia',
      icon: UserCheck,
      current: router.pathname === '/admin/asistencia'
    },
    {
      name: 'Talleres',
      href: '/admin/talleres',
      icon: Calendar,
      current: router.pathname === '/admin/talleres'
    },
    {
      name: 'Categorías',
      href: '/admin/categorias',
      icon: Tags,
      current: router.pathname === '/admin/categorias'
    },
    {
      name: 'Participantes',
      href: '/admin/participantes',
      icon: Users,
      current: router.pathname === '/admin/participantes'
    },
    // Solo mostrar "Staff" para DVADMIN
    ...(isDevAdmin ? [{
      name: 'Staff',
      href: '/admin/staff',
      icon: Shield,
      current: router.pathname === '/admin/staff'
    }] : []),
    // Solo mostrar "Usuarios" para MGADMIN
    ...(isMegaAdmin ? [{
      name: 'Usuarios',
      href: '/admin/usuarios',
      icon: Settings,
      current: router.pathname === '/admin/usuarios'
    }] : [])
  ];

  return (
    <div className="bg-card w-64 min-h-screen border-r border-border">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CD</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            Congreso Digital
          </span>
        </Link>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Administración
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="mr-3 w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}