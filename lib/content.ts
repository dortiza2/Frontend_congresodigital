// Importar tipos centralizados
import type {
  CongressInfo,
  Speaker,
  AgendaItem,
  ActivityCard,
  Winner,
  CareerInfo,
  AgendaStatus
} from '../types/content';
import { getSpeakers as getSpeakersFromAPI } from '@/services/speakers';
import { getActivities as getActivitiesFromService } from '@/services/activities';
import { getPodiumByYear } from '@/services/podium';
import { safeGet, apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

// Helpers y type guards locales
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function isNumberArrayLike(v: unknown): v is Array<unknown> {
  return Array.isArray(v);
}
function coerceNumberArray(arr: unknown): number[] {
  if (!Array.isArray(arr)) return [];
  const out: number[] = [];
  for (const el of arr) {
    const n = Number(el);
    if (!Number.isNaN(n)) out.push(n);
  }
  return out;
}

// Re-exportar tipos para compatibilidad
export type {
  CongressInfo,
  Speaker,
  AgendaItem,
  ActivityCard,
  Winner,
  CareerInfo,
  AgendaStatus
}

// Funciones de acceso a datos
// Migradas a API real con fallbacks controlados (arrays vacíos)

export async function getCongressInfo(): Promise<CongressInfo> {
  const currentYear = new Date().getFullYear();
  return {
    title: `Congreso Digital ${currentYear}`,
    summary: "El evento tecnológico más importante del año donde convergen innovación, desarrollo y futuro digital",
    mainImageUrl: "/assets/congress-main.jpg",
    lastUpdated: new Date().toISOString()
  };
}

export async function getSpeakers(): Promise<Speaker[]> {
  try {
    const apiSpeakers = await getSpeakersFromAPI();
    return apiSpeakers.map(s => ({
      id: String(s.id),
      name: s.name,
      topic: s.roleTitle || 'Speaker',
      bioShort: s.bio?.substring(0, 150) || '',
      photoUrl: s.avatarUrl || '/uploads/speakers/perfil1.jpg',
      priority: 1
    })).sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.error('Error fetching speakers from API:', error);
    return [];
  }
}

export async function getAgenda(day?: string): Promise<AgendaItem[]> {
  const { success, data } = await safeGet<any[]>(API_ENDPOINTS.ACTIVITIES.PUBLIC_LIST);
  if (!success || !Array.isArray(data)) return [];
  const agenda: AgendaItem[] = data.map((item: any) => {
    const start = item.startTime ?? item.startISO ?? new Date().toISOString();
    const end = item.endTime ?? item.endISO ?? new Date().toISOString();
    const typeUpper: string | undefined = item.activityType ?? item.type;
    const type: 'actividad' | 'charla' = typeUpper === 'CHARLA' ? 'charla' : 'actividad';
    return {
      id: String(item.id ?? item.activityId ?? ''),
      type,
      title: String(item.title ?? 'Sin título'),
      speakerId: item.speakerId ? String(item.speakerId) : undefined,
      startISO: String(start),
      endISO: String(end),
      place: item.location ? String(item.location) : undefined,
      day: String(start).split('T')[0]
    };
  });
  const filtered = day ? agenda.filter((i) => i.day === day) : agenda;
  return filtered.sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
}

export async function getActivities(): Promise<ActivityCard[]> {
  try {
    const activities = await getActivitiesFromService();
    return activities.map(a => ({
      id: String(a.id),
      title: a.title,
      imageUrl: '/assets/placeholder.jpg',
      short: a.description ? a.description.slice(0, 120) : '',
      description: a.description || undefined,
      link: undefined
    }));
  } catch (error) {
    console.error('Error fetching activities from API:', error);
    return [];
  }
}

export async function getWinners(year: number): Promise<Winner[]> {
  try {
    const podium = await getPodiumByYear(year);
    return podium.map(w => ({
      id: `${w.year}-${w.activityId}-${w.place}`,
      year: Number(w.year),
      activityId: String(w.activityId ?? ''),
      place: (Number(w.place) as 1 | 2 | 3) ?? 1,
      projectName: w.winnerName,
      projectShort: w.prizeDescription,
      photoUrl: '/assets/podium/default.jpg',
      team: undefined
    })).sort((a, b) => a.place - b.place);
  } catch (error) {
    console.warn(`Error fetching winners for year ${year}:`, error);
    return [];
  }
}

// Función para obtener información de ediciones (migrada a API o estático simple)
export async function getEditions(): Promise<{
  currentYear: number;
  availableYears: number[];
  hasEdition: Record<string, boolean>;
}> {
  const currentYear = new Date().getFullYear();
  try {
    const res = await apiClient.get('/api/editions');
    if (isRecord(res)) {
      const current = typeof res.currentYear === 'number' ? res.currentYear : currentYear;
      const years = isNumberArrayLike(res.availableYears) ? coerceNumberArray(res.availableYears) : [currentYear];
      const edition = (isRecord(res.hasEdition)) ? (res.hasEdition as Record<string, boolean>) : { [String(currentYear)]: true };
      return {
        currentYear: Number(current),
        availableYears: years,
        hasEdition: edition
      };
    }
  } catch (error) {
    console.warn('Error fetching editions info:', error);
  }
  return {
    currentYear,
    availableYears: [currentYear],
    hasEdition: { [String(currentYear)]: true }
  };
}

export async function getCareerInfo(): Promise<CareerInfo> {
  // Si existe endpoint real, usarlo; caso contrario retornar vacío controlado
  try {
    const res = await apiClient.get('/api/career');
    if (isRecord(res)) {
      const heading = typeof res.heading === 'string' ? res.heading : 'Carrera de Ingeniería en Sistemas — UMG';
      const body = typeof res.body === 'string' ? res.body : '';
      const links = Array.isArray(res.links) ? res.links.filter(isRecord).map(l => ({
        label: typeof l.label === 'string' ? l.label : '',
        url: typeof l.url === 'string' ? l.url : '#'
      })) : [];
      return { heading, body, links };
    }
  } catch (error) {
    // log controlado
  }
  return {
    heading: 'Carrera de Ingeniería en Sistemas — UMG',
    body: '',
    links: []
  };
}

// Utilidades adicionales
export function getCurrentAgendaStatus(agenda: AgendaItem[]): AgendaStatus {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const todayAgenda = agenda.filter(item => item.day === today);
  if (todayAgenda.length === 0) {
    return { isEventDay: false };
  }
  const current = todayAgenda.find(item => {
    const start = new Date(item.startISO);
    const end = new Date(item.endISO);
    return now >= start && now <= end;
  });
  const upcoming = todayAgenda
    .filter(item => new Date(item.startISO) > now)
    .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
  return {
    current,
    next: upcoming[0],
    isEventDay: true
  };
}