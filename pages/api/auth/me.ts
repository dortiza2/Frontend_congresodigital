import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'https://congreso-api.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Primero intentar con NextAuth (Google OAuth)
    const session = await getServerSession(req, res, authOptions);
    
    if (session && session.user) {
      // Usuario autenticado con Google
      return res.status(200).json({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        organization: session.user.organization,
        roles: session.user.roles || [],
        roleLevel: session.user.roleLevel ?? 0
      });
    }

    // Si no hay sesión de NextAuth, verificar token JWT del backend
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Validar token con el backend
    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const sessionData = await response.json();
      const u = sessionData.user || {};
      const roleLevel = sessionData.roleLevel ?? 0;
      
      // Retornar datos del usuario del backend con el modelo de sesión
      return res.status(200).json({
        id: u.id,
        email: u.email,
        name: u.name,
        roles: Array.isArray(u.roles) ? u.roles : [],
        roleLevel
      });
    } catch (backendError) {
      console.error('Error validating token with backend:', backendError);
      return res.status(401).json({ message: 'Token validation failed' });
    }
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}