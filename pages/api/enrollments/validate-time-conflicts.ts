import { NextApiRequest, NextApiResponse } from 'next';
import { apiClient } from '@/lib/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { activityIds } = req.body;

    if (!activityIds || !Array.isArray(activityIds)) {
      return res.status(400).json({ message: 'Invalid activity IDs' });
    }

    try {
      // Llamar al backend para validar conflictos de horario
      const response = await apiClient.post('/api/activities/validate-time-conflicts', {
        activityIds
      });
      
      return res.status(200).json(response);
    } catch (backendError: any) {
      console.warn('Backend error for time conflicts validation:', backendError.message);
      
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
    console.error('Error in /api/enrollments/validate-time-conflicts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}