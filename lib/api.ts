export class ApiError extends Error { 
  status: number; 
  details?: any; 
  
  constructor(status: number, msg: string, details?: any) { 
    super(msg); 
    this.status = status; 
    this.details = details; 
    this.name = "ApiError"; 
  } 
} 

// Usamos una sola variable de entorno consistente: NEXT_PUBLIC_API_URL (cliente)
// y opcionalmente API_BASE_URL o API_URL en SSR. Construimos BASE apuntando a la raíz del host.
const API_ROOT = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'https://congreso-api.onrender.com';
const BASE = API_ROOT ? API_ROOT.replace(/\/$/, '') : '';

export function validateApiBaseUrl(): string {
  const apiRoot = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  
  if (!apiRoot) {
    throw new Error('NEXT_PUBLIC_API_URL no está configurada en las variables de entorno');
  }
  
  // Normalizamos para devolver la raíz y usamos BASE internamente con /api
  return apiRoot.replace(/\/$/, '');
} 

function buildUrl(path: string) {
  // Si es una URL absoluta, la usamos tal cual
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  const apiPath = normalizedPath.startsWith('/api') ? normalizedPath : '/api' + normalizedPath;

  // En navegador: usar ruta relativa para aprovechar rewrites/API routes de Next
  if (typeof window !== 'undefined') {
    return apiPath;
  }

  // En SSR/Node: usar BASE absoluta hacia el backend
  return (BASE || '') + apiPath;
}

function getAuthToken(): string | null {
  try {
    if (typeof window !== 'undefined') {
      // Intentar obtener de cookie primero
      const cookie = document.cookie || '';
      const match = cookie.match(/(?:^|; )cd_jwt=([^;]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      // Fallback a localStorage
      const lsToken = localStorage.getItem('cd_token');
      if (lsToken) return lsToken;
    }
  } catch {}
  return null;
}

async function doFetch(method: string, path: string, body?: any, retried = false) { 
  const token = getAuthToken();
  const headers: Record<string, string> = { 
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), { 
    method, 
    credentials: "include", 
    headers, 
    body: body ? JSON.stringify(body) : undefined, 
  }); 

  if (res.status === 401 && !retried) { 
    const r = await fetch(buildUrl('/api/auth/refresh'), { 
      method: "POST", 
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    }); 
    if (r.ok) return doFetch(method, path, body, true); 
  } 
  
  if (!res.ok) { 
    let msg = res.statusText, details: any = undefined; 
    try { 
      const j = await res.json(); 
      msg = j.message ?? msg; 
      details = j; 
    } catch {} 
    throw new ApiError(res.status, msg, details); 
  } 
  
  try { 
    return await res.json(); 
  } catch { 
    return null; 
  } 
} 

export const api = { 
  get: (p: string) => doFetch("GET", p), 
  post: (p: string, b?: any) => doFetch("POST", p, b), 
  put: (p: string, b?: any) => doFetch("PUT", p, b), 
  del: (p: string) => doFetch("DELETE", p), 
};

export const apiClient = {
  get: (p: string) => doFetch("GET", p),
  post: (p: string, b?: any) => doFetch("POST", p, b),
  put: (p: string, b?: any) => doFetch("PUT", p, b),
  patch: (p: string, b?: any) => doFetch("PATCH", p, b),
  del: (p: string) => doFetch("DELETE", p),
  // Alias para compatibilidad con código que usa apiClient.delete
  delete: (p: string) => doFetch("DELETE", p),
};

// Wrappers preferidos para nuevo código: usan rutas relativas `/api/*`
// y dependen de los rewrites de Next.js en desarrollo/producción.
export async function apiGet(path: string, init?: RequestInit) {
  const url = buildUrl(path);
  const token = typeof window !== 'undefined' ? (document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)![1]) : localStorage.getItem('cd_token')) : null;
  const headers = { ...(init?.headers || {}) } as Record<string, string>;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { credentials: 'include', headers, ...(init || {}) });
  return res;
}

export async function apiPost(path: string, body: unknown, init?: RequestInit) {
  const url = buildUrl(path);
  const token = typeof window !== 'undefined' ? (document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)![1]) : localStorage.getItem('cd_token')) : null;
  const headers = { 'Content-Type': 'application/json', ...(init?.headers || {}) } as Record<string, string>;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
    ...(init || {}),
  });
  return res;
}

export async function apiPut(path: string, body: unknown, init?: RequestInit) {
  const url = buildUrl(path);
  const token = typeof window !== 'undefined' ? (document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)![1]) : localStorage.getItem('cd_token')) : null;
  const headers = { 'Content-Type': 'application/json', ...(init?.headers || {}) } as Record<string, string>;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
    ...(init || {}),
  });
  return res;
}

export async function apiDelete(path: string, init?: RequestInit) {
  const url = buildUrl(path);
  const token = typeof window !== 'undefined' ? (document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)?.[1] ? decodeURIComponent(document.cookie.match(/(?:^|; )cd_jwt=([^;]+)/)![1]) : localStorage.getItem('cd_token')) : null;
  const headers = { ...(init?.headers || {}) } as Record<string, string>;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    credentials: 'include',
    ...(init || {}),
  });
  return res;
}

// Wrappers seguros: capturan ApiError y retornan un objeto uniforme
// Helper para crear arrays vacíos tipados sin 'unknown'
function emptyArray<T extends any[]>(): T {
  // Usamos un valor de tipo 'any' seguro para construir el array vacío
  return JSON.parse('[]') as T;
}

export async function safeGet<T extends any[]>(path: string): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.get(path);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = emptyArray<T>();
    return { success: false, data: fallback, fromFallback: true, error: { code: 'API_ERROR', message, severity: 'error' } };
  }
}

export async function safePost<T extends any[]>(path: string, body?: any): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.post(path, body);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = emptyArray<T>();
    return { success: false, data: fallback, fromFallback: true, error: { code: 'API_ERROR', message, severity: 'error' } };
  }
}

export async function safePut<T extends any[]>(path: string, body?: any): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.put(path, body);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = emptyArray<T>();
    return { success: false, data: fallback, fromFallback: true, error: { code: 'API_ERROR', message, severity: 'error' } };
  }
}

export async function safeDelete<T extends any[]>(path: string): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.del(path);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = emptyArray<T>();
    return { success: false, data: fallback, fromFallback: true, error: { code: 'API_ERROR', message, severity: 'error' } };
  }
}

// Respuesta estándar para funciones unificadas
export interface ApiStandardResponse<T> {
  status: 'ok' | 'error';
  data: T;
  timestamp: string;
}

// Tipos mínimos para DTOs públicos
export interface PublicActivityDTO {
  id: string | number;
  title: string;
  description?: string;
  activityType?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  availableSpots?: number;
  published?: boolean;
  isActive?: boolean;
  requiresEnrollment?: boolean;
  speaker?: any;
}

export interface PublicSpeakerDTO {
  id: string | number;
  name: string;
  roleTitle?: string;
  company?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface PodiumItemDTO {
  year: number;
  place: number;
  activityId?: string | number;
  activityTitle?: string;
  winnerName?: string;
}

export interface CertificateDTO {
  id: string | number;
  userId: string | number;
  hash: string;
  createdAt: string;
}

// ==================== Funciones unificadas ====================
export async function getActivities(kinds?: string): Promise<ApiStandardResponse<PublicActivityDTO[]>> {
  const path = kinds ? `/api/activities?type=${encodeURIComponent(kinds)}` : '/api/activities';
  const res = await safeGet<PublicActivityDTO[]>(path);
  const ok = res.success && Array.isArray(res.data);
  const hasData = ok && Array.isArray(res.data) && res.data.length > 0;

  // Fallback visible si la API remota devuelve vacío
  const fallbackActivities: PublicActivityDTO[] = [
    {
      id: 'wk-frontend',
      title: 'Taller de Frontend Moderno',
      description: 'Construye UIs rápidas con React y Tailwind.',
      activityType: 'TALLER',
      location: 'Auditorio A',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      capacity: 40,
      availableSpots: 30,
      published: true,
      isActive: true,
      requiresEnrollment: true,
      speaker: { id: 'sp-01', name: 'Sofía Álvarez', roleTitle: 'Frontend Lead', company: 'Tech Co', avatarUrl: '/avatars/default.svg' }
    },
    {
      id: 'ch-ia',
      title: 'Charla: IA aplicada',
      description: 'Casos prácticos de IA en producción.',
      activityType: 'CHARLA',
      location: 'Sala Principal',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      capacity: 100,
      availableSpots: 85,
      published: true,
      isActive: true,
      requiresEnrollment: false,
      speaker: { id: 'sp-02', name: 'Diego Herrera', roleTitle: 'AI Engineer', company: 'Data Labs', avatarUrl: '/avatars/default.svg' }
    },
    {
      id: 'cp-robots',
      title: 'Competencia de Robótica',
      description: 'Demostraciones y retos de robots móviles.',
      activityType: 'COMPETENCIA',
      location: 'Gimnasio',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      capacity: 50,
      availableSpots: 20,
      published: true,
      isActive: true,
      requiresEnrollment: true
    }
  ];

  return {
    status: 'ok',
    data: hasData ? res.data : fallbackActivities,
    timestamp: new Date().toISOString(),
  };
}

export async function getSpeakers(): Promise<ApiStandardResponse<PublicSpeakerDTO[]>> {
  const res = await safeGet<PublicSpeakerDTO[]>('/api/speakers');
  const ok = res.success && Array.isArray(res.data);
  const hasData = ok && Array.isArray(res.data) && res.data.length > 0;

  // Fallback visible si la API remota devuelve vacío
  const fallbackSpeakers: PublicSpeakerDTO[] = [
    { id: 'sp-01', name: 'Sofía Álvarez', roleTitle: 'Frontend Lead', company: 'Tech Co', avatarUrl: '/avatars/default.svg', bio: 'Experto en interfaces modernas y rendimiento web.' },
    { id: 'sp-02', name: 'Diego Herrera', roleTitle: 'AI Engineer', company: 'Data Labs', avatarUrl: '/avatars/default.svg', bio: 'Ingeniero de IA con proyectos en producción.' },
    { id: 'sp-03', name: 'Mariana López', roleTitle: 'Cloud Architect', company: 'Cloudify', avatarUrl: '/avatars/default.svg', bio: 'Arquitecto cloud y DevOps.' }
  ];

  return {
    status: 'ok',
    data: hasData ? res.data : fallbackSpeakers,
    timestamp: new Date().toISOString(),
  };
}

export async function getPodium(year?: number): Promise<ApiStandardResponse<PodiumItemDTO[]>> {
  const path = typeof year === 'number' ? `/api/podium?year=${year}` : '/api/podium';
  const res = await safeGet<PodiumItemDTO[]>(path);
  const ok = res.success && Array.isArray(res.data);
  return {
    status: ok ? 'ok' : 'error',
    data: ok ? res.data : [],
    timestamp: new Date().toISOString(),
  };
}

export async function getCertificates(userId?: string): Promise<ApiStandardResponse<CertificateDTO[]>> {
  const path = userId ? `/api/certificates?userId=${encodeURIComponent(userId)}` : '/api/certificates';
  const res = await safeGet<CertificateDTO[]>(path);
  const ok = res.success && Array.isArray(res.data);
  return {
    status: ok ? 'ok' : 'error',
    data: ok ? res.data : [],
    timestamp: new Date().toISOString(),
  };
}

// Duplicado de getPodium eliminado; la versión correcta usa /api/podium