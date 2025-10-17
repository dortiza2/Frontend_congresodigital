# Frontend Repository Restructuring and Deployment Plan

## Current Project Analysis

### Existing Structure
The project currently exists as a monorepo with the following structure:
```
Congreso_tecnologico_proyectoD/
├── desarrollo/landing/          # Next.js frontend application
├── vercel.json                  # Vercel deployment configuration
├── .env.production.example      # Environment variables template
└── [other monorepo components]
```

### Frontend Application Details
- **Framework**: Next.js 15.4.5 with React 19
- **Styling**: TailwindCSS 4
- **Authentication**: NextAuth.js 4.24.11
- **UI Components**: Radix UI components
- **Build Tool**: Vite with TypeScript
- **Key Features**: Congress management system with admin portal, QR scanning, activity management

## Restructuring Plan

### 1. Repository Structure Cleanup
The goal is to create a clean frontend-only repository structure:

```
Frontend_congresodigital/
├── components/          # React components
├── contexts/           # React contexts (Auth, Toast)
├── data/               # Static data files
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and services
├── pages/              # Next.js pages
├── public/             # Static assets
├── scripts/            # Build and utility scripts
├── services/           # API services
├── styles/             # CSS and styling
├── types/              # TypeScript type definitions
├── middleware.ts       # Next.js middleware
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── next.config.js      # Next.js configuration
├── postcss.config.mjs  # PostCSS configuration
├── vercel.json         # Vercel deployment config
└── README.md           # Project documentation
```

### 2. Git Repository Setup

#### Initialize Git Repository
```bash
cd Frontend_congresodigital
git init
git remote add origin https://github.com/dortiza2/Frontend_congresodigital.git
```

#### Create .gitignore
```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

### 3. Vercel Configuration
The existing `vercel.json` configuration:
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

### 4. Environment Setup

#### Required Environment Variables
```bash
# Copy from .env.production.example
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=your-database-url
API_URL=your-api-endpoint
```

### 5. Deployment Instructions for README.md

#### Development Setup
```bash
# Clone the repository
git clone https://github.com/dortiza2/Frontend_congresodigital.git
cd Frontend_congresodigital

# Install dependencies
npm install

# Run development server
npm run dev
```

#### Production Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

#### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### 6. Key Dependencies
- **Next.js**: 15.4.5 - React framework
- **React**: 19.1.1 - UI library
- **TailwindCSS**: 4.x - Utility-first CSS
- **NextAuth**: 4.24.11 - Authentication
- **Radix UI**: Component primitives
- **TypeScript**: 5.x - Type safety
- **SWR**: 2.2.5 - Data fetching

### 7. Available Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - Code linting
- `npm run lint:images` - Asset validation

### 8. Features Overview
- Congress landing page with hero, agenda, speakers
- Admin portal for activity management
- QR code scanning for attendance
- User authentication and role management
- Responsive design with mobile optimization
- Real-time data synchronization

## Implementation Steps

1. **Extract Frontend Code**: Move `desarrollo/landing/` contents to root
2. **Update Vercel Config**: Ensure proper routing configuration
3. **Initialize Git**: Create new repository with proper .gitignore
4. **Create README**: Document setup and deployment process
5. **Configure Environment**: Set up environment variables
6. **Test Deployment**: Verify Vercel deployment works
7. **Push to Remote**: Upload to GitHub repository

## Security Considerations
- Environment variables properly configured
- API endpoints secured
- Authentication properly implemented
- Sensitive data not committed to repository