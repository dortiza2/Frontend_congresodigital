import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ForbiddenPage from '@/components/ui/forbidden';

export default function Custom403() {
  const router = useRouter();
  const [errorInfo, setErrorInfo] = useState({
    title: "Acceso Denegado",
    message: "No tienes permisos para acceder a esta página."
  });

  useEffect(() => {
    // Obtener información del error desde query params
    const { reason, level, required } = router.query;
    
    if (reason === 'role_level') {
      const currentLevel = parseInt(level as string) || 0;
      const requiredLevel = parseInt(required as string) || 1;
      
      const getRoleLevelDescription = (level: number): string => {
        switch (level) {
          case 3: return 'DevAdmin';
          case 2: return 'Admin';
          case 1: return 'Asistente';
          default: return 'Sin rol';
        }
      };

      setErrorInfo({
        title: "Nivel de Acceso Insuficiente",
        message: `Tu nivel actual es ${getRoleLevelDescription(currentLevel)} (Nivel ${currentLevel}). Esta página requiere ${getRoleLevelDescription(requiredLevel)} (Nivel ${requiredLevel}) o superior.`
      });
    } else if (reason === 'not_authenticated') {
      setErrorInfo({
        title: "Autenticación Requerida",
        message: "Debes iniciar sesión para acceder a esta página."
      });
    } else if (reason === 'admin_required') {
      setErrorInfo({
        title: "Acceso de Administrador Requerido",
        message: "Esta página requiere permisos de administrador para acceder."
      });
    }
  }, [router.query]);

  return (
    <ForbiddenPage
      title={errorInfo.title}
      message={errorInfo.message}
      showBackButton={true}
      showHomeButton={true}
    />
  );
}