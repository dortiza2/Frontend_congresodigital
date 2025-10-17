# Frontend Congreso Digital

Aplicación frontend para el Congreso Tecnológico - Sistema de gestión de congresos con portal administrativo, escaneo QR y gestión de actividades.

## 🚀 Tecnologías

- **Framework**: Next.js 15.4.5
- **UI Library**: React 19.1.1
- **Styling**: TailwindCSS 4
- **Authentication**: NextAuth.js 4.24.11
- **Language**: TypeScript 5
- **Deployment**: Vercel

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta en Vercel (para deployment)

## 🛠️ Instalación Local

### 1. Clonar el Repositorio
```bash
git clone https://github.com/dortiza2/Frontend_congresodigital.git
cd Frontend_congresodigital
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Copiar el archivo de ejemplo y configurar las variables:
```bash
cp .env.production.example .env.local
```

Editar `.env.local` con tus valores:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secreto-jwt
DATABASE_URL=tu-url-base-datos
API_URL=tu-url-api-backend
```

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Construye para producción |
| `npm start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta linter |
| `npm run lint:images` | Valida assets públicos |

## 🚀 Deployment en Vercel

### Opción 1: Deployment Automático
1. Conectar repositorio GitHub a Vercel
2. Vercel detectará automáticamente Next.js
3. Configurar variables de entorno en dashboard de Vercel
4. Cada push a `main` desplegará automáticamente

### Opción 2: Deployment Manual
```bash
# Construir para producción
npm run build

# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

### Configuración de Vercel
El proyecto incluye `vercel.json` con configuración optimizada:
```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/next" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

## 📁 Estructura del Proyecto

```
Frontend_congresodigital/
├── components/          # Componentes React
│   ├── admin/          # Componentes de administrador
│   ├── auth/           # Componentes de autenticación
│   ├── portal/         # Componentes del portal estudiantil
│   └── ui/             # Componentes UI reutilizables
├── contexts/           # Contextos de React
├── data/               # Datos estáticos
├── hooks/              # Hooks personalizados
├── lib/                # Utilidades y servicios
├── pages/              # Páginas de Next.js
│   ├── admin/          # Páginas administrativas
│   ├── api/            # Endpoints API
│   ├── portal/         # Páginas del portal
│   └── staff/          # Páginas de staff
├── public/             # Assets estáticos
├── scripts/            # Scripts de build
├── services/           # Servicios API
├── styles/             # Estilos CSS
└── types/              # Definiciones TypeScript
```

## 🔧 Características Principales

- **Landing Page**: Hero, agenda, expositores, patrocinadores
- **Portal Administrativo**: Gestión de actividades, usuarios, asistencia
- **Portal Estudiantil**: Inscripciones, asistencia QR, certificados
- **Escaneo QR**: Sistema de asistencia por código QR
- **Autenticación**: Sistema de roles y permisos
- **Diseño Responsivo**: Optimizado para móviles

## 🔐 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXTAUTH_URL` | URL de la aplicación | `https://tudominio.com` |
| `NEXTAUTH_SECRET` | Secreto JWT | `tu-secreto-seguro` |
| `DATABASE_URL` | URL base de datos | `postgresql://...` |
| `API_URL` | URL del backend API | `https://api.tudominio.com` |

## 🧪 Testing

```bash
# Ejecutar tests de accesibilidad
npm run a11y:check
```

## 📱 Optimización Móvil

- Diseño mobile-first
- Touch interactions optimizadas
- Carga progresiva de imágenes
- PWA compatible

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto es propiedad privada.

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**Nota**: Este proyecto fue generado con Next.js y está optimizado para deployment en Vercel.