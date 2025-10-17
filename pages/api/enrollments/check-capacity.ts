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
      // Llamar al backend para verificar capacidad
      const response = await apiClient.post('/api/activities/check-capacity', {
        activityIds
      });
      
      return res.status(200).json(response);
    } catch (backendError: any) {
      console.warn('Backend error for capacity check:', backendError.message);
      
      // Si el backend no está disponible, devolver respuesta por defecto
      if (backendError.status >= 400) {
        return res.status(200).json({ 
          activities: activityIds.map((id: string) => ({
            activityId: id,
            status: 'available',
            isFull: false,
            currentEnrollments: 0,
            maxCapacity: 100,
            availableSpots: 100
          }))
        });
      }
      
      throw backendError;
    }
  } catch (error) {
    console.error('Error in /api/enrollments/check-capacity:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}