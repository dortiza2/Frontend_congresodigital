/**
 * Adaptador para normalizar datos de actividades públicas
 * Convierte datos del API (snake_case) a formato esperado por el frontend (camelCase)
 */

// Tipo para datos crudos del API (snake_case)
interface RawActivityData {
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

/**
 * Convierte un valor a string de forma segura
 */
function toSafeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * Convierte un valor a número de forma segura
 */
function toSafeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Convierte un valor a boolean de forma segura
 */
function toSafeBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
}

/**
 * Normaliza el tipo/kind de actividad
 */
function normalizeActivityKind(raw: RawActivityData): string {
  // Priorizar activity_type sobre type
  const kind = raw.activity_type || raw.type;
  
  if (!kind) return 'ACTIVIDAD';
  
  const kindStr = toSafeString(kind).toLowerCase().trim();
  
  // Mapear tipos conocidos
  switch (kindStr) {
    case 'taller':
    case 'workshop':
      return 'taller';
    case 'competencia':
    case 'competition':
      return 'competencia';
    case 'conferencia':
    case 'conference':
    case 'charla':
    case 'talk':
      return 'conferencia';
    default:
      return kindStr || 'ACTIVIDAD';
  }
}

/**
 * Normaliza la fecha/hora a formato ISO
 */
function normalizeDateTime(raw: RawActivityData, field: 'start' | 'end'): string {
  let dateValue: string | undefined;
  
  if (field === 'start') {
    dateValue = raw.start_time || raw.startTime;
  } else {
    dateValue = raw.end_time || raw.endTime;
  }
  
  if (!dateValue) {
    // Retornar fecha por defecto en el futuro
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30); // 30 días en el futuro
    return defaultDate.toISOString();
  }
  
  try {
    // Intentar parsear la fecha
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString();
  } catch {
    // Si falla, retornar fecha por defecto
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate.toISOString();
  }
}

/**
 * Calcula si la actividad está llena
 */
function calculateIsFull(raw: RawActivityData, enrolled: number, capacity: number): boolean {
  // Si viene is_full o isFull, usarlo
  if (raw.is_full !== undefined) return toSafeBoolean(raw.is_full);
  if (raw.isFull !== undefined) return toSafeBoolean(raw.isFull);
  
  // Calcular basado en enrolled vs capacity
  return enrolled >= capacity;
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
    speakerId: raw.speakerId !== undefined && raw.speakerId !== null ? toSafeString(raw.speakerId) : null,
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
      .map(item => adaptActivity(item));
  } catch (error) {
    console.error('Error adaptando actividades:', error);
    return [];
  }
}