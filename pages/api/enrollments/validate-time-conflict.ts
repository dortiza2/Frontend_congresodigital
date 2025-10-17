import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { apiClient } from '@/lib/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verificar autenticación
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { activityIds } = req.body;

    if (!activityIds || !Array.isArray(activityIds)) {
      return res.status(400).json({ message: 'Invalid activity IDs' });
    }

    try {
      // Llamar al backend para validar conflictos con inscripciones del usuario
      const response = await apiClient.post('/api/enrollments/validate-time-conflict', {
        userEmail: session.user.email,
        activityIds
      });
      
      return res.status(200).json(response);
    } catch (backendError: any) {
      console.warn('Backend error for time conflict validation:', backendError.message);
      
      // Si el backend no está disponible, devolver respuesta por defecto (sin conflictos)
      if (backendError.status >= 400) {
        return res.status(200).json({ 
          hasConflicts: false,
          conflicts: [],
          message: 'Validación de conflictos no disponible temporalmente'
        });
      }
      
      throw backendError;
    }
  } catch (error) {
    console.error('Error in /api/enrollments/validate-time-conflict:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}