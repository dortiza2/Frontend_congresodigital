/**
 * Servicio API Unificado para el Congreso Digital
 * 
 * Este módulo centraliza todas las llamadas a la API, proporcionando:
 * - Manejo unificado de errores
 * - Compatibilidad SSR/CSR
 * - Fallbacks seguros
 * - Caché inteligente
 * - Formato de respuesta estandarizado
 */

import { apiClient, safeGet, safePost } from './api';

// ==================== TIPOS DE DATOS ====================

/**
 * Actividad pública del congreso
 */
export interface PublicActivity {
  id: string;
  title: string;
  description?: string;
  activityType: 'CHARLA' | 'TALLER' | 'COMPETENCIA';
  location?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSpots: number;
  enrolledCount?: number;
  published: boolean;
  isActive: boolean;
  requiresEnrollment: boolean;
  speaker?: PublicSpeaker;
  imageUrl?: string;
  short?: string;
  link?: string;
}

/**
 * Ponente/expositor del congreso
 */
export interface PublicSpeaker {
  id: string;
  name: string;
  roleTitle?: string;
  company?: string;
  avatarUrl: string;
  bio?: string;
  links?: Record<string, any>;
}

/**
 * Ganador del podio/premiación
 */
export interface PodiumItem {
  year: number;
  place: number;
  activityId: string;
  activityTitle?: string;
  userId?: string;
  winnerName?: string;
  awardDate?: string;
  activityType?: string;
  winnerType?: string;
  teamId?: string;
  prizeDescription?: string;
}

/**
 * Certificado del estudiante
 */
export interface Certificate {
  id: string;
  userId: string;
  hash: string;
  createdAt: string;
  activityTitle?: string;
  hours?: number;
  isGenerated?: boolean;
  downloadUrl?: string;
}

/**
 * Respuesta estandarizada de la API
 */
export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data: T;
  timestamp: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Opciones de configuración para las llamadas API
 */
export interface ApiOptions {
  useCache?: boolean;
  revalidate?: number;
  fallbackToMock?: boolean;
}

// ==================== CACHÉ GLOBAL ====================

/**
 * Caché simple en memoria para optimizar rendimiento
 */
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set<T>(key: string, data: T, ttlSeconds = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia global de caché
const globalCache = new SimpleCache();

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Genera timestamp ISO format
 */
const getTimestamp = (): string => new Date().toISOString();

/**
 * Crea respuesta exitosa estándar
 */
const createSuccessResponse = <T>(data: T): ApiResponse<T> => ({
  status: 'ok',
  data,
  timestamp: getTimestamp()
});

/**
 * Crea respuesta de error estándar
 */
const createErrorResponse = <T>(error: any, fallbackData: T): ApiResponse<T> => {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  const errorCode = error?.status || error?.code || 'API_ERROR';

  return {
    status: 'error',
    data: fallbackData,
    timestamp: getTimestamp(),
    error: {
      code: errorCode,
      message: errorMessage,
      details: error?.details || error
    }
  };
};

/**
 * Log de errores controlado (solo en desarrollo)
 */
const logError = (operation: string, error: any, context?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[UnifiedApi] Error en ${operation}:`, error);
    if (context) {
      console.error('[UnifiedApi] Contexto:', context);
    }
  }
};

/**
 * Genera clave de caché única
 */
const generateCacheKey = (endpoint: string, params?: any): string => {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramsStr}`;
};

/**
 * Carga datos mock locales como fallback
 */
const loadLocalMockData = async <T>(_filename: string): Promise<T[]> => {
  // Fallbacks locales deshabilitados: siempre devolver arreglo vacío
  return [];
};

// ==================== SERVICIO API PRINCIPAL ====================

/**
 * Servicio API Unificado - Funciones principales
 */
export const unifiedApi = {
  /**
   * Obtiene lista de actividades públicas
   */
  async getActivities(kinds?: string, options: ApiOptions = {}): Promise<ApiResponse<PublicActivity[]>> {
    const operation = 'getActivities';
    const cacheKey = generateCacheKey('activities', { kinds });
    
    try {
      // Intentar obtener desde caché
      if (options.useCache !== false) {
        const cached = globalCache.get<PublicActivity[]>(cacheKey);
        if (cached) {
          return createSuccessResponse(cached);
        }
      }

      // Llamar a la API
      const endpoint = kinds ? `/api/activities?type=${kinds}` : '/api/activities';
      const result = await safeGet<any>(endpoint);
      
      let activities: PublicActivity[] = [];
      
      if (result.success && !result.fromFallback && Array.isArray(result.data)) {
        // Mapear datos de la API al formato esperado
        activities = result.data.map((item: any) => ({
          id: String(item.id || item.activityId || ''),
          title: item.title || item.name || 'Actividad sin título',
          description: item.description || item.shortDescription || '',
          activityType: item.activityType || item.type || 'CHARLA',
          location: item.location || item.place || '',
          startTime: item.startTime || item.startISO || new Date().toISOString(),
          endTime: item.endTime || item.endISO || new Date().toISOString(),
          capacity: Number(item.capacity || 0),
          availableSpots: Number(item.availableSpots || item.capacity || 0),
          enrolledCount: Number(item.enrolledCount || 0),
          published: Boolean(item.published),
          isActive: Boolean(item.isActive !== false),
          requiresEnrollment: Boolean(item.requiresEnrollment),
          imageUrl: item.imageUrl || item.image || `/assets/activities/default.jpg`,
          short: item.short || item.shortDescription || '',
          link: item.link || `/inscripcion?actividad=${item.id || ''}`,
          speaker: item.speaker ? this.mapSpeaker(item.speaker) : undefined
        }));
      } else {
        // Sin fallback a JSON local
        activities = [];
      }

      // Guardar en caché
      if (options.useCache !== false) {
        globalCache.set(cacheKey, activities, options.revalidate || 60);
      }

      return createSuccessResponse(activities);
    } catch (error) {
      logError(operation, error, { kinds, options });
      // Retornar error estandarizado con data vacía
      return createErrorResponse(error, []);
    }
  },

  /**
   * Obtiene lista de ponentes/expositores
   */
  async getSpeakers(options: ApiOptions = {}): Promise<ApiResponse<PublicSpeaker[]>> {
    const operation = 'getSpeakers';
    const cacheKey = generateCacheKey('speakers');
    
    try {
      // Intentar obtener desde caché
      if (options.useCache !== false) {
        const cached = globalCache.get<PublicSpeaker[]>(cacheKey);
        if (cached) {
          return createSuccessResponse(cached);
        }
      }

      // Llamar a la API
      const result = await safeGet<any>('/api/speakers');
      
      let speakers: PublicSpeaker[] = [];
      
      if (result.success && !result.fromFallback && Array.isArray(result.data)) {
        // Mapear datos de la API al formato esperado
        speakers = result.data.map((item: any) => this.mapSpeaker(item));
      } else {
        // Sin fallback a JSON local
        speakers = [];
      }

      // Guardar en caché
      if (options.useCache !== false) {
        globalCache.set(cacheKey, speakers, options.revalidate || 60);
      }

      return createSuccessResponse(speakers);
    } catch (error) {
      logError(operation, error, { options });
      // Retornar error estandarizado con data vacía
      return createErrorResponse(error, []);
    }
  },

  /**
   * Obtiene lista de ganadores del podio para un año específico
   */
  async getPodium(year?: number, options: ApiOptions = {}): Promise<ApiResponse<PodiumItem[]>> {
    const operation = 'getPodium';
    const targetYear = year || new Date().getFullYear();
    const cacheKey = generateCacheKey('podium', { year: targetYear });
    
    try {
      // Intentar obtener desde caché
      if (options.useCache !== false) {
        const cached = globalCache.get<PodiumItem[]>(cacheKey);
        if (cached) {
          return createSuccessResponse(cached);
        }
      }

      // Llamar a la API
      const endpoint = `/api/podium?year=${targetYear}`;
      const result = await safeGet<any>(endpoint);
      
      let podium: PodiumItem[] = [];
      
      if (result.success && !result.fromFallback && Array.isArray(result.data)) {
        // Mapear datos de la API al formato esperado
        podium = result.data.map((item: any) => ({
          year: Number(item.year || targetYear),
          place: Number(item.place || 0),
          activityId: String(item.activityId || item.id || ''),
          activityTitle: item.activityTitle || item.title || item.activityName || '',
          userId: item.userId || item.winnerId || '',
          winnerName: item.winnerName || item.projectName || item.teamName || 'Ganador',
          awardDate: item.awardDate || item.date || new Date().toISOString(),
          activityType: item.activityType || 'COMPETENCIA',
          winnerType: item.winnerType || 'INDIVIDUAL',
          teamId: item.teamId || '',
          prizeDescription: item.prizeDescription || item.projectShort || item.description || ''
        }));
      } else {
        // Sin fallback a JSON local
        podium = [];
      }

      // Guardar en caché
      if (options.useCache !== false) {
        globalCache.set(cacheKey, podium, options.revalidate || 60);
      }

      return createSuccessResponse(podium);
    } catch (error) {
      logError(operation, error, { year: targetYear, options });
      // Retornar error estandarizado con data vacía
      return createErrorResponse(error, []);
    }
  },

  /**
   * Obtiene certificados de un usuario
   */
  async getCertificates(userId?: string, options: ApiOptions = {}): Promise<ApiResponse<Certificate[]>> {
    const operation = 'getCertificates';
    const targetUserId = userId || 'current';
    const cacheKey = generateCacheKey('certificates', { userId: targetUserId });
    
    try {
      // Intentar obtener desde caché (solo para usuarios específicos)
      if (options.useCache !== false && userId) {
        const cached = globalCache.get<Certificate[]>(cacheKey);
        if (cached) {
          return createSuccessResponse(cached);
        }
      }

      // Determinar endpoint según contexto
      const endpoint = userId 
        ? `/api/certificates?userId=${userId}`
        : '/api/student/certificates';
      
      const result = await safeGet<any>(endpoint);
      
      let certificates: Certificate[] = [];
      
      if (result.success && !result.fromFallback && Array.isArray(result.data)) {
        // Mapear datos de la API al formato esperado
        certificates = result.data.map((item: any) => ({
          id: String(item.id || item.certificateId || ''),
          userId: String(item.userId || item.studentId || userId || ''),
          hash: item.hash || item.certificateHash || this.generateHash(),
          createdAt: item.createdAt || item.generatedAt || new Date().toISOString(),
          activityTitle: item.activityTitle || item.activityName || 'Actividad',
          hours: Number(item.hours || item.creditHours || 0),
          isGenerated: Boolean(item.isGenerated || item.generated || true),
          downloadUrl: item.downloadUrl || item.certificateUrl || item.url || `/certificates/${item.id}.html`
        }));
      }

      // Guardar en caché (solo para usuarios específicos)
      if (options.useCache !== false && userId) {
        globalCache.set(cacheKey, certificates, options.revalidate || 30);
      }

      return createSuccessResponse(certificates);
    } catch (error) {
      logError(operation, error, { userId: targetUserId, options });
      return createErrorResponse(error, []);
    }
  },

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Mapea un speaker de la API al formato público
   */
  mapSpeaker(apiSpeaker: any): PublicSpeaker {
    return {
      id: String(apiSpeaker.id || apiSpeaker.speakerId || ''),
      name: apiSpeaker.name || apiSpeaker.fullName || 'Ponente',
      roleTitle: apiSpeaker.roleTitle || apiSpeaker.title || apiSpeaker.position || '',
      company: apiSpeaker.company || apiSpeaker.institution || apiSpeaker.organization || '',
      avatarUrl: apiSpeaker.avatarUrl || apiSpeaker.photoUrl || apiSpeaker.image || '/avatars/default.svg',
      bio: apiSpeaker.bio || apiSpeaker.biography || apiSpeaker.description || '',
      links: this.parseLinks(apiSpeaker.links)
    };
  },

  /**
   * Parsea links de diferentes formatos
   */
  parseLinks(links: any): Record<string, any> {
    if (!links) return {};
    
    if (typeof links === 'string') {
      try {
        return JSON.parse(links);
      } catch {
        return {};
      }
    }
    
    return typeof links === 'object' ? links : {};
  },

  /**
   * Genera hash único para certificados
   */
  generateHash(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },

  /**
   * Limpia el caché global
   */
  clearCache(): void {
    globalCache.clear();
  },

  /**
   * Limpia entradas expiradas del caché
   */
  cleanupCache(): void {
    globalCache.clearExpired();
  }
};

// ==================== FUNCIONES DE UTILIDAD ====================

/**
 * Wrapper para getStaticProps con manejo de errores
 */
export async function getStaticPropsWithApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: { revalidate?: number } = {}
): Promise<{ props: { data: T; error: boolean; timestamp: string } }> {
  try {
    const response = await fetcher();
    
    return {
      props: {
        data: response.data,
        error: response.status === 'error',
        timestamp: response.timestamp
      }
    };
  } catch (error) {
    logError('getStaticPropsWithApi', error);
    
    return {
      props: {
        data: [] as unknown as T,
        error: true,
        timestamp: getTimestamp()
      }
    };
  }
}

/**
 * Wrapper para getServerSideProps con manejo de errores
 */
export async function getServerSidePropsWithApi<T>(
  fetcher: () => Promise<ApiResponse<T>>
): Promise<{ props: { data: T; error: boolean; timestamp: string } }> {
  try {
    const response = await fetcher();
    
    return {
      props: {
        data: response.data,
        error: response.status === 'error',
        timestamp: response.timestamp
      }
    };
  } catch (error) {
    logError('getServerSidePropsWithApi', error);
    
    return {
      props: {
        data: [] as unknown as T,
        error: true,
        timestamp: getTimestamp()
      }
    };
  }
}

// ==================== EXPORT DEFAULT ====================

export default unifiedApi;