import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { apiClient } from '@/lib/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      // Si no hay sesión, devolver array vacío en lugar de error
      return res.status(200).json([]);
    }

    const userId = session.user.id;

    try {
      // Llamar al backend para obtener las inscripciones del estudiante (incluye campo attended)
      const enrollments = await apiClient.get(`/api/student/enrollments`);
      
      // Devolver las inscripciones normalizadas
      return res.status(200).json(enrollments || []);
    } catch (backendError: any) {
      console.warn('Backend error for enrollments:', backendError.message);
      
      // Si el backend devuelve 204, 404, o cualquier 4xx, devolver array vacío
      if (backendError.status >= 400 && backendError.status < 500) {
        return res.status(200).json([]);
      }
      
      // Para errores 5xx del backend, también devolver array vacío para no romper la UI
      if (backendError.status >= 500) {
        console.error('Backend 5xx error, returning empty array to prevent UI break');
        return res.status(200).json([]);
      }
      
      // Para cualquier otro error, devolver array vacío
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error in /api/users/me/enrollments:', error);
    // Incluso en caso de error interno, devolver array vacío para no romper la UI
    return res.status(200).json([]);
  }
}