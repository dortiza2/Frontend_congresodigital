import { NextApiRequest, NextApiResponse } from 'next';
import { apiClient } from '@/lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { year } = req.query;

    const params = new URLSearchParams();
    if (year && typeof year === 'string') params.append('year', year);

    const path = `/api/podium${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const data = await apiClient.get(path);
      // Asegurar array como respuesta pública
      return res.status(200).json(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e: any) {
      console.warn('Podium backend not available or empty, attempting winners fallback:', e?.message || e);
      // Intentar fallback a winners por año
      try {
        const winnersPath = `/api/winners${params.toString() ? `?${params.toString()}` : ''}`;
        const winners = await apiClient.get(winnersPath);
        return res.status(200).json(Array.isArray(winners) ? winners : (winners?.data ?? []));
      } catch (e2: any) {
        console.warn('Winners fallback failed or empty, returning []:', e2?.message || e2);
        return res.status(200).json([]);
      }
    }
  } catch (error) {
    console.error('Error fetching podium:', error);
    return res.status(200).json([]);
  }
}