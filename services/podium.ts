import { safeGet, apiClient, ApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

// Alinear con nombres del API: year, place, activityId, activityTitle, userId, winnerName, awardDate
export type PodiumItem = {
  year: number;
  place: number;
  activityId: string;
  activityTitle?: string;
  userId?: string;
  winnerName?: string;
  awardDate?: string;
  // Campos opcionales adicionales si el backend los provee
  activityType?: string;
  winnerType?: string;
  teamId?: string;
  prizeDescription?: string;
};

export const getPodiumByYear = async (year?: number): Promise<PodiumItem[]> => {
  const targetYear = year ?? new Date().getFullYear();
  const url = API_ENDPOINTS.PODIUM.BY_YEAR(String(targetYear));
  const res = await safeGet<any[]>(url);
  if (res.success && Array.isArray(res.data)) {
    return res.data.map((w: any) => ({
      year: Number(w.year ?? targetYear),
      place: Number(w.place ?? 0),
      activityId: String(w.activityId ?? w.id ?? ''),
      activityTitle: w.activityTitle ?? w.title ?? undefined,
      userId: w.userId ?? undefined,
      winnerName: w.winnerName ?? w.projectName ?? undefined,
      awardDate: w.awardDate ?? undefined,
      activityType: w.activityType ?? undefined,
      winnerType: w.winnerType ?? undefined,
      teamId: w.teamId ?? undefined,
      prizeDescription: w.prizeDescription ?? w.projectShort ?? undefined,
    }));
  }
  return [];
};

export const getWinners = async (): Promise<PodiumItem[]> => {
  try {
    return await apiClient.get(API_ENDPOINTS.WINNERS.LIST);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 500 || error.status === 404)) {
      console.warn('Winners API error, returning empty array:', error);
      return [];
    }
    throw error;
  }
};