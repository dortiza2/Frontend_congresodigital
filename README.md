# Frontend Congreso Digital

Aplicación web del Congreso Digital UMG construida con Next.js. Incluye landing pública, portal de estudiantes, área administrativa, autenticación (credenciales y Google), escaneo QR de asistencia y certificados.

## 🚀 Tecnologías

- Framework: `Next.js 15.4.5` (Pages Router)
- UI: `React 19.1.1` + Radix UI + componentes base tipo shadcn
- Estilos: `TailwindCSS 4`
- Autenticación: `NextAuth.js 4.24.11` (JWT strategy)
- Lenguaje: `TypeScript 5`
- Data fetching: `SWR`
- Gráficas: `ApexCharts`
- Deploy: `Vercel`

## 🧩 Características

- Landing: hero, agenda, expositores, patrocinadores, FAQs y más
- Portal estudiantil: perfil, QR para asistencia, diplomas/certificados
- Panel administrativo: gestión de actividades, categorías, usuarios, speakers, asistencia
- Staff: escaneo QR y control de asistencia
- Autenticación: credenciales contra backend + Google OAuth con dominios permitidos
- Proxy de API: todas las rutas `/api/*` se redirigen al backend definido por variable de entorno

## 📁 Estructura del Proyecto

```
Frontend_congresodigital/
├── components/          # Componentes React (admin/, portal/, ui/)
├── contexts/            # Contextos (AuthContext, ToastContext)
├── hooks/               # Hooks personalizados (SWR, UI state)
├── lib/                 # Cliente API, configuración, utilidades
├── pages/               # Pages Router (páginas y API routes)
│   ├── api/             # Endpoints proxy/unificados (faq, podium, etc.)
│   └── api/auth/        # NextAuth y helpers de sesión
├── public/              # Assets estáticos (avatars, imágenes)
├── services/            # Servicios de dominio (activities, speakers, profile)
├── styles/              # Estilos globales
└── types/               # Tipos TypeScript
```

## 📋 Requisitos Previos

- Node.js 18+
- npm (recomendado; se usa `package-lock.json`)
- Cuenta en Vercel (si vas a desplegar)

## ⚙️ Configuración Local Rápida

1) Clonar e instalar dependencias
```bash
git clone https://github.com/dortiza2/Frontend_congresodigital.git
cd Frontend_congresodigital
npm install
```

2) Crear `.env.local` (mínimo)
```
# URL del frontend
NEXTAUTH_URL=http://localhost:3000

# Secreto para NextAuth (usa uno fuerte)
NEXTAUTH_SECRET=pon_aqui_un_secreto_fuerte

# Base del backend (local o remoto)
# Para backend local: http://127.0.0.1:5213
# Para backend remoto: https://congreso-api.onrender.com
NEXT_PUBLIC_API_URL=https://congreso-api.onrender.com

# OAuth Google (opcional, si quieres probar Google login)
# Si se configuran, el provider se habilita automáticamente
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Dominios permitidos para Google (coma-separados)
NEXT_PUBLIC_ALLOWED_DOMAINS=umg.edu.gt,miumg.edu.gt

# Deshabilitar Google si fuera necesario
# NEXT_PUBLIC_ENABLE_GOOGLE=false

# Otros opcionales usados por la UI
NEXT_PUBLIC_CONGRESS_EDITION=2025
NEXT_PUBLIC_CONTACT_EMAIL=congreso@umg.edu.gt
NEXT_PUBLIC_SUPPORT_EMAIL=soporte@umg.edu.gt

# En SSR se respetan API_BASE_URL o API_URL si deseas declararlas
# API_BASE_URL=
# API_URL=
```

3) Ejecutar en desarrollo
```bash
npm run dev
```
Abre http://localhost:3000

Consejo: si usas backend local en `:5213`, está habilitado en `images.remotePatterns` para servir imágenes.

## 🔐 Autenticación y Acceso

- Proveedores: `Credentials` (contra backend) y `Google` (si hay credenciales y no está deshabilitado)
- Dominios permitidos para Google: `NEXT_PUBLIC_ALLOWED_DOMAINS` (por defecto acepta dominios de UMG)
- Rutas NextAuth: `/api/auth/*` (página de login y error: `/inscripcion`)
- Estrategia de sesión: JWT
- Middleware protege rutas (`middleware.ts`) según roles y niveles

## 🌐 API y Proxys

- Base del backend: `NEXT_PUBLIC_API_URL` (cliente) y opcionalmente `API_BASE_URL`/`API_URL` (SSR)
- Cliente API: `lib/api.ts`
  - En el navegador usa rutas relativas (`/api/*`) y aprovecha `rewrites` de Next.js
  - En SSR usa base absoluta hacia el backend
  - Wrappers seguros: `safeGet`, `safePost`, `safePut`, `safeDelete`
- Rewrites (`next.config.js`):
  - `beforeFiles`: proxy directo para `/api/auth/register` y `/api/auth/login`
  - `fallback`: redirige `/api/:path*` a `${NEXT_PUBLIC_API_URL}/api/:path*`
  - Se evita interferir con rutas propias de NextAuth

## 🧪 Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm start` | Arranca en modo producción |
| `npm run lint` | Linter de Next.js |
| `npm run lint:images` | Valida assets públicos (nombres y tamaños) |
| `npm run a11y:check` | Revisión de accesibilidad con Playwright + axe |

## 🚀 Despliegue en Vercel

- Zero‑Config para Next.js. `vercel.json` mínimo:
```json
{
  "version": 2
}
```
- Define las variables en el Dashboard (Production, y opcionalmente Preview):
  - Requeridas: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`
  - Opcionales: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_ALLOWED_DOMAINS`, `NEXT_PUBLIC_ENABLE_GOOGLE`, `NEXT_PUBLIC_CONGRESS_EDITION`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `API_BASE_URL`/`API_URL`
- Nota: si ves el warning `unused-build-settings`, quita `builds` de `vercel.json` (ya está resuelto en este repo).

## ✅ Healthchecks y Verificación

- `GET /api/health` → `{ success: true, status: 'ok', ... }`
- `GET /api/auth/session` → 200 con o sin sesión (si devuelve 500, revisa variables NextAuth)
- Endpoints proxied:
  - `GET /api/faq`
  - `GET /api/podium?year=2025`
  - `GET /api/activities`

## 🧭 Rutas Clave

- Públicas: `/`, `/inscripcion`, `/faq`, `/actividades`, `/agenda`, `/podio`
- Requieren sesión: `/portal`, `/mi-cuenta`, `/portal/qr`, `/portal/diplomas`
- Staff/Admin: `/staff`, `/dashboard`, `/admin/*`

## 🐞 Troubleshooting

- `[CLIENT_FETCH_ERROR]` en NextAuth
  - Causa común: falta `NEXTAUTH_URL` o `NEXTAUTH_SECRET`, o backend inaccesible
  - Verifica que `NEXT_PUBLIC_API_URL` apunte a un host válido (no `localhost` en producción)
- `unused-build-settings` (Vercel)
  - Sucede si `vercel.json` define `builds`; ya eliminado en este repo
- Múltiples lockfiles
  - Usa `npm` y elimina `yarn.lock` si aparece para evitar advertencias
- OAuth Google
  - Asegura `NEXTAUTH_URL` correcto por entorno (Preview/Production) y URIs en consola de Google

## 📬 Contacto y soporte

- Contacto: `${NEXT_PUBLIC_CONTACT_EMAIL}`
- Soporte: `${NEXT_PUBLIC_SUPPORT_EMAIL}`

## 📝 Licencia

Proyecto privado del equipo del Congreso Digital UMG.