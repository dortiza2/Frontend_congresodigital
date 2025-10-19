/**
 * Adaptador para normalizar datos de actividades públicas
 * Convierte datos del API (snake_case) a formato esperado por el frontend (camelCase)
 */

// Tipo para datos crudos del API (snake_case)
export interface RawActivityData {
  id?: string | number;
  title?: string;
  type?: string;
  activity_type?: string;
  location?: string;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  capacity?: string | number;
  published?: boolean;
  enrolled_count?: string | number;
  enrolledCount?: string | number;
  enrolled?: string | number;
  available_spots?: string | number;
  is_full?: boolean;
  isFull?: boolean;
  description?: string;
  instructor?: string;
  // Optional relation to a speaker
  speakerId?: string;
  // En algunos DTOs (backend) viene como objeto anidado
  speaker?: {
    id?: string | number;
    name?: string;
    roleTitle?: string;
    company?: string;
    avatarUrl?: string;
  };
  requirements?: string[];
}

// Tipo normalizado para el frontend
export interface PublicActivity {
  id: string;
  title: string;
  kind: string;
  activityType?: string; // Uppercase enum-like mirror of kind
  location: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  enrolledCount?: number; // Mirror for API compatibility
  availableSpots?: number; // If provided by API, or computed
  isFull: boolean;
  published: boolean;
  description: string | null;
  instructor: string | null;
  // Optional relation to a speaker
  speakerId?: string | null;
  requirements: string[] | null;
}

function toSafeString(value: unknown, fallback: string = ''): string {
  if (value === undefined || value === null) return fallback;
  try { return String(value); } catch { return fallback; }
}

function toSafeNumber(value: unknown, fallback: number = 0): number {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toSafeBoolean(value: unknown, fallback: boolean = true): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return fallback;
}

function normalizeActivityKind(raw: RawActivityData): string {
  const type = (raw.activity_type ?? raw.type ?? '').toLowerCase();
  if (type.includes('taller') || type.includes('workshop')) return 'taller';
  if (type.includes('competencia') || type.includes('competition')) return 'competencia';
  if (type.includes('charla') || type.includes('talk')) return 'charla';
  return 'actividad';
}

function normalizeDateTime(raw: RawActivityData, which: 'start' | 'end'): string {
  const v = which === 'start' ? (raw.start_time ?? raw.startTime) : (raw.end_time ?? raw.endTime);
  if (typeof v === 'string') return v;
  return toSafeString(v);
}

function calculateIsFull(raw: RawActivityData, enrolled: number, capacity: number): boolean {
  const isFullFlag = raw.is_full ?? raw.isFull;
  if (typeof isFullFlag === 'boolean') return isFullFlag;
  return Math.max(0, capacity - enrolled) === 0;
}

/**
 * Adapta un objeto de actividad crudo a formato normalizado
 */
export function adaptActivity(raw: RawActivityData): PublicActivity {
  const id = toSafeString(raw.id);
  const title = toSafeString(raw.title, 'Actividad sin título');
  const kind = normalizeActivityKind(raw);
  // Map kind -> activityType (uppercase) for API compatibility
  const activityType = kind ? kind.toUpperCase() : 'ACTIVIDAD';
  const location = raw.location ? toSafeString(raw.location) : null;
  const startTime = normalizeDateTime(raw, 'start');
  const endTime = normalizeDateTime(raw, 'end');
  const capacity = toSafeNumber(raw.capacity, 0);
  const enrolled = toSafeNumber(raw.enrolledCount || raw.enrolled_count || raw.enrolled, 0);
  const published = toSafeBoolean(raw.published, true);
  const isFull = calculateIsFull(raw, enrolled, capacity);
  const availableSpots = raw.available_spots !== undefined
    ? toSafeNumber(raw.available_spots, Math.max(capacity - enrolled, 0))
    : Math.max(capacity - enrolled, 0);

  // Determinar speakerId a partir de objeto anidado `speaker` o campo plano `speakerId`
  const nestedSpeakerId = raw.speaker && raw.speaker.id !== undefined && raw.speaker.id !== null
    ? toSafeString(raw.speaker.id)
    : null;
  const speakerId = nestedSpeakerId ?? (raw.speakerId !== undefined && raw.speakerId !== null ? toSafeString(raw.speakerId) : null);
  
  return {
    id,
    title,
    kind,
    activityType,
    location,
    startTime,
    endTime,
    capacity,
    enrolled,
    enrolledCount: enrolled,
    availableSpots,
    isFull,
    published,
    description: raw.description !== undefined && raw.description !== null ? toSafeString(raw.description) : null,
    instructor: raw.instructor !== undefined && raw.instructor !== null ? toSafeString(raw.instructor) : null,
    speakerId,
    requirements: raw.requirements && Array.isArray(raw.requirements) && raw.requirements.length > 0 ? raw.requirements : null
  };
}

/**
 * Adapta una lista de actividades crudas
 */
export function adaptActivities(rawData: any): PublicActivity[] {
  try {
    // Manejar diferentes formatos de respuesta
    let items: any[] = [];
    
    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData && Array.isArray(rawData.items)) {
      items = rawData.items;
    } else if (rawData && Array.isArray(rawData.data)) {
      items = rawData.data;
    } else {
      console.warn('Formato de datos de actividades no reconocido:', rawData);
      return [];
    }
    
    return items
      .filter(item => item && typeof item === 'object')
      .map(adaptActivity);
  } catch (err) {
    console.error('Error al adaptar actividades:', err);
    return [];
  }
}