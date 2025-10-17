const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5213'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '5213' },
      { protocol: 'http', hostname: 'localhost', port: '5213' },
      { protocol: 'https', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return {
        beforeFiles: [
          {
            source: '/avatars/:name.png',
            destination: '/avatars/:name.svg',
          },
          // Proxy directo a backend para evitar captura por NextAuth
          {
            source: '/api/auth/register',
            destination: `${API_BASE}/api/auth/register`,
          },
          {
            source: '/api/auth/login',
            destination: `${API_BASE}/api/auth/login`,
          },
        ],
        // Use fallback so file-system routes like NextAuth (/api/auth) are NOT proxied
        afterFiles: [],
        fallback: [
          {
            source: '/api/:path*',
            destination: `${API_BASE}/api/:path*`,
          }
        ],
      };
    }

    // Producción: mantener avatars y añadir fallback para /api hacia API_BASE
    return {
      beforeFiles: [
        {
          source: '/avatars/:name.png',
          destination: '/avatars/:name.svg',
        },
      ],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${API_BASE}/api/:path*`,
        }
      ],
    };
  },
}

module.exports = nextConfig