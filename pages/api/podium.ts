import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5213';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { year } = req.query;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (year) params.append('year', year as string);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/podium${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching podium:', error);
    res.status(500).json({ message: 'Error fetching podium data' });
  }
}