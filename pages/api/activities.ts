import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'https://congreso-api.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { from, to, type } = req.query;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (from) params.append('from', from as string);
    if (to) params.append('to', to as string);
    if (type) params.append('type', type as string);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/activities${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities data' });
  }
}