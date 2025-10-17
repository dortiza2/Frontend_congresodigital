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
const API_ROOT = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL;
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

async function doFetch(method: string, path: string, body?: any, retried = false) { 
  const res = await fetch(buildUrl(path), { 
    method, 
    credentials: "include", 
    headers: { 
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    }, 
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
  if (!path.startsWith('/')) path = '/' + path;
  const res = await fetch(`/api${path}`, { credentials: 'include', ...(init || {}) });
  return res;
}

export async function apiPost(path: string, body: unknown, init?: RequestInit) {
  if (!path.startsWith('/')) path = '/' + path;
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include',
    body: JSON.stringify(body),
    ...(init || {}),
  });
  return res;
}

export async function apiPut(path: string, body: unknown, init?: RequestInit) {
  if (!path.startsWith('/')) path = '/' + path;
  const res = await fetch(`/api${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include',
    body: JSON.stringify(body),
    ...(init || {}),
  });
  return res;
}

export async function apiDelete(path: string, init?: RequestInit) {
  if (!path.startsWith('/')) path = '/' + path;
  const res = await fetch(`/api${path}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(init || {}),
  });
  return res;
}

// Wrappers seguros: capturan ApiError y retornan un objeto uniforme
export async function safeGet<T extends any[]>(path: string): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.get(path);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = [] as unknown as T;
    return { success: false, data: fallback, fromFallback: true, error: { code: 'API_ERROR', message, severity: 'error' } };
  }
}

export async function safePost<T extends any[]>(path: string, body?: any): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.post(path, body);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = [] as unknown as T;
    return { success: false, data: fallback, fromFallback: true, error: { code: 'API_ERROR', message, severity: 'error' } };
  }
}

export async function safePut<T extends any[]>(path: string, body?: any): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.put(path, body);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = [] as unknown as T;
    return { success: false, data: fallback, fromFallback: true, error: { code: 'API_ERROR', message, severity: 'error' } };
  }
}

export async function safeDelete<T extends any[]>(path: string): Promise<{ success: boolean; data: T; fromFallback: boolean; error?: { code: string; message: string; severity: 'error' | 'warning' | 'info' } }>{
  try {
    const data = await apiClient.del(path);
    return { success: true, data, fromFallback: false };
  } catch (err: any) {
    const message = err instanceof ApiError ? (err.details?.message ?? err.message ?? 'Error en API') : (err?.message ?? 'Error desconocido');
    const fallback = [] as unknown as T;
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
  return {
    status: ok ? 'ok' : 'error',
    data: ok ? res.data : [],
    timestamp: new Date().toISOString(),
  };
}

export async function getSpeakers(): Promise<ApiStandardResponse<PublicSpeakerDTO[]>> {
  const res = await safeGet<PublicSpeakerDTO[]>('/api/speakers');
  const ok = res.success && Array.isArray(res.data);
  return {
    status: ok ? 'ok' : 'error',
    data: ok ? res.data : [],
    timestamp: new Date().toISOString(),
  };
}

export async function getPodium(year?: number): Promise<ApiStandardResponse<PodiumItemDTO[]>> {
  const path = typeof year === 'number' ? `/api/winners?year=${year}` : '/api/winners';
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