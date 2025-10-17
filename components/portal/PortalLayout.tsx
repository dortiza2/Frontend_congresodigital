import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StudentNavbar from '@/components/portal/StudentNavbar';
import { Footer } from '@/components/Footer';

interface PortalLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavbar?: boolean;
  showFooter?: boolean;
}

export default function PortalLayout({ 
  children, 
  title = 'Portal del Estudiante',
  showNavbar = true,
  showFooter = true 
}: PortalLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showNavbar && <StudentNavbar />}
      
      <main className="flex-1">
        {title && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {user && (
                    <p className="text-sm text-gray-600 mt-1">
                      Bienvenido, {user.fullName || user.name || user.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}

// Componente específico para páginas del portal sin título
export function PortalPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout title="" showNavbar={true} showFooter={true}>
      {children}
    </PortalLayout>
  );
}

// Componente para páginas del portal con título personalizado
export function PortalPageWithTitle({ 
  children, 
  title 
}: { 
  children: React.ReactNode;
  title: string;
}) {
  return (
    <PortalLayout title={title} showNavbar={true} showFooter={true}>
      {children}
    </PortalLayout>
  );
}