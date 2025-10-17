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
    return apiSpeakers.map(speaker => ({
      id: speaker.id,
      name: speaker.name,
      topic: speaker.roleTitle || 'Speaker',
      bioShort: speaker.bio?.substring(0, 150) || '',
      photoUrl: speaker.avatarUrl || '/uploads/speakers/perfil1.jpg',
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
  const agenda: AgendaItem[] = data.map((item: any) => ({
    id: String(item.id ?? item.activityId ?? ''),
    type: 'actividad',
    title: item.title ?? 'Sin título',
    speakerId: item.speakerId ?? undefined,
    startISO: item.startTime ?? item.startISO ?? new Date().toISOString(),
    endISO: item.endTime ?? item.endISO ?? new Date().toISOString(),
    place: item.location ?? item.place ?? undefined,
    day: (item.startTime ?? item.startISO ?? new Date().toISOString()).split('T')[0]
  }));
  const filtered = day ? agenda.filter((i) => i.day === day) : agenda;
  return filtered.sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
}

export async function getActivities(): Promise<ActivityCard[]> {
  try {
    const activities = await getActivitiesFromService();
    return activities.map(a => ({
      id: a.id,
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
      year: w.year,
      activityId: w.activityId,
      place: (w.place as 1 | 2 | 3) ?? 1,
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
    // Si existe endpoint real, usarlo; de lo contrario mantener estructura mínima
    const res = await apiClient.get('/api/editions');
    if (res && typeof res === 'object') {
      const obj = res as Record<string, unknown>;
      const current = typeof obj.currentYear === 'number' ? obj.currentYear : currentYear;
      const years = Array.isArray(obj.availableYears) ? (obj.availableYears as unknown[]).map(y => Number(y)) : [currentYear];
      const edition = (obj.hasEdition && typeof obj.hasEdition === 'object') ? (obj.hasEdition as Record<string, boolean>) : { [String(currentYear)]: true };
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
    const { success, data } = await safeGet<any[]>('/api/career');
    if (success && data) {
      return data as unknown as CareerInfo;
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