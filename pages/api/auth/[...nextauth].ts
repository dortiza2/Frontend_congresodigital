import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'

// Tipo mínimo para datos del backend y type guard
type BackendAuthData = {
  user?: {
    OrgName?: string;
    organization?: string;
    roles?: string[];
    roleLevel?: number;
    Id?: string;
    id?: string;
  };
  token?: string;
};

function isBackendAuthData(x: unknown): x is BackendAuthData {
  if (typeof x !== 'object' || x === null) return false;
  const obj = x as Record<string, unknown>;
  return 'user' in obj || 'token' in obj;
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(((process.env.NEXT_PUBLIC_ENABLE_GOOGLE ?? 'true') !== 'false') && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    ] : []),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'https://congreso-api.onrender.com';
          const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });

          if (response.ok) {
            const data = await response.json();
            return {
              id: data.user.Id || data.user.id,
              email: data.user.Email || data.user.email,
              name: data.user.FullName || data.user.name || credentials.email,
              backendData: data
            }
          }
        } catch (error) {
          console.error('Error al autenticar con backend:', error);
        }

        return null
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Para login con credenciales, ya está autenticado por el provider
      if (account?.provider === 'credentials') {
        return true
      }

      // Para Google OAuth, validar dominios permitidos
      if (account?.provider === 'google') {
        const allowedDomains = process.env.GOOGLE_ALLOWED_DOMAINS?.split(',') || ['miumg.edu.gt'];
        const userDomain = user.email?.split('@')[1];
        
        if (!user.email || !userDomain || !allowedDomains.includes(userDomain)) {
          console.log(`Login rechazado: dominio ${userDomain} no está en la lista permitida:`, allowedDomains);
          return false // Rechazar el login
        }

        // Integrar con nuestro backend para crear/actualizar usuario
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'https://congreso-api.onrender.com';
          const response = await fetch(`${backendUrl}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              picture: user.image
            })
          });

          if (response.ok) {
            const data = await response.json();
            // Guardar datos del backend en el token para uso posterior
            user.backendData = data;
          } else if (response.status === 403) {
            // Asegurar error de acceso denegado por dominio
            return false;
          } else {
            console.error('Error al crear usuario en backend:', await response.text());
          }
        } catch (error) {
          console.error('Error al conectar con backend:', error);
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      // Cuando el usuario se autentica por primera vez
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
        
        // Datos del backend si están disponibles
        const backendData = user.backendData;
        if (isBackendAuthData(backendData)) {
          token.organization = backendData.user?.OrgName || backendData.user?.organization || ''
          token.roles = backendData.user?.roles || []
          token.roleLevel = backendData.user?.roleLevel || 0
          token.roleCodes = backendData.user?.roles || []
          if (backendData.token) token.backendToken = backendData.token
          if (backendData.user?.Id || backendData.user?.id) token.backendId = backendData.user.Id || backendData.user.id
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Pasar datos del token a la sesión
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.image as string
        session.user.organization = token.organization as string
        session.user.roles = token.roles as string[]
        session.user.roleLevel = token.roleLevel as number
        session.user.roleCodes = (token.roleCodes as string[]) || (token.roles as string[])
        if (token.backendId) session.user.backendId = token.backendId as string
        if (token.backendToken) session.user.backendToken = token.backendToken as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Si viene de una URL específica y es relativa al dominio, permitirla
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Si es una URL relativa, construir la URL completa
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Redirección temporal al portal - la redirección real se manejará en el cliente
      return `${baseUrl}/portal`;
    }
  },
  pages: {
    signIn: '/inscripcion',
    error: '/inscripcion'
  },
  session: {
    strategy: 'jwt'
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // true en producción, false en desarrollo
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  }
}

export default NextAuth(authOptions)