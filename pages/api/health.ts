import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ success: true, status: 'ok', version: 'dev', time: new Date().toISOString(), message: 'healthy' });
}