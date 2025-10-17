import useSWR from 'swr';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import { toast } from 'sonner';

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'CONFERENCE' | 'WORKSHOP' | 'PANEL' | 'NETWORKING' | 'OTHER';
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  speakerId?: string;
  speakerName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  speakerId?: string;
}

export interface UpdateActivityRequest {
  title?: string;
  description?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  speakerId?: string;
  isActive?: boolean;
}

export interface ActivityStats {
  totalActivities: number;
  activeActivities: number;
  upcomingActivities: number;
  pastActivities: number;
  totalCapacity: number;
  averageCapacity: number;
}

export interface PagedActivitiesResponse {
  activities: Activity[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

export const useActivities = (page = 1, pageSize = 10, filters?: {
  type?: string;
  speakerId?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters?.type && { type: filters.type }),
    ...(filters?.speakerId && { speakerId: filters.speakerId }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive.toString() }),
    ...(filters?.startDate && { startDate: filters.startDate }),
    ...(filters?.endDate && { endDate: filters.endDate }),
  });

  const { data, error, isLoading, mutate } = useSWR<PagedActivitiesResponse>(
    `${API_ENDPOINTS.ADMIN.ACTIVITIES}?${params}`,
    fetcher
  );

  return {
    activities: data?.activities || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate
  };
};

export const useActivity = (id: string) => {
  const { data, error, isLoading, mutate } = useSWR<Activity>(
    id ? `${API_ENDPOINTS.ADMIN.ACTIVITIES}/${id}` : null,
    fetcher
  );

  return {
    activity: data,
    isLoading,
    error,
    mutate
  };
};

export const useActivityStats = () => {
  const { data, error, isLoading } = useSWR<ActivityStats>(
    API_ENDPOINTS.ADMIN.ACTIVITY_STATS,
    fetcher
  );

  return {
    stats: data,
    isLoading,
    error
  };
};

export const createActivity = async (activity: CreateActivityRequest): Promise<Activity> => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.ADMIN.ACTIVITIES, activity);
    toast.success('Actividad creada exitosamente');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al crear la actividad';
    toast.error(message);
    throw error;
  }
};

export const updateActivity = async (id: string, activity: UpdateActivityRequest): Promise<Activity> => {
  try {
    const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.ACTIVITIES}/${id}`, activity);
    toast.success('Actividad actualizada exitosamente');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar la actividad';
    toast.error(message);
    throw error;
  }
};

export const deleteActivity = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${API_ENDPOINTS.ADMIN.ACTIVITIES}/${id}`);
    toast.success('Actividad eliminada exitosamente');
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al eliminar la actividad';
    toast.error(message);
    throw error;
  }
};

export const toggleActivityStatus = async (id: string): Promise<Activity> => {
  try {
    const response = await apiClient.patch(`${API_ENDPOINTS.ADMIN.ACTIVITIES}/${id}/toggle`);
    toast.success('Estado de actividad actualizado');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al cambiar el estado de la actividad';
    toast.error(message);
    throw error;
  }
};