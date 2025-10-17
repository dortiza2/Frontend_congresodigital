import type { NextApiRequest, NextApiResponse } from 'next';
import { winnersByYear, type YearWinners } from '@/data/winners';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { year } = req.query;

    if (typeof year === 'string') {
      const data: YearWinners | undefined = winnersByYear[year];
      return res.status(200).json(Array.isArray(data) ? data : []);
    }

    // Si no se proporciona año, devolver el año más reciente disponible
    const years = Object.keys(winnersByYear).sort((a, b) => Number(b) - Number(a));
    const latest = years.length ? winnersByYear[years[0]] : [];
    return res.status(200).json(latest);
  } catch (error) {
    console.error('Error in /api/winners:', error);
    return res.status(200).json([]);
  }
}