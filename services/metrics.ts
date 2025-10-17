import { apiClient } from '@/lib/api';

export interface MetricsData {
  totalParticipants: number;
  totalActivities: number;
  totalEnrollments: number;
  activitiesByType: Array<{
    type: string;
    count: number;
  }>;
  upcomingActivities: Array<{
    id: string;
    title: string;
    startTime: string;
    activityType: string;
    enrollmentCount: number;
  }>;
  recentEnrollments: Array<{
    id: string;
    userName: string;
    activityTitle: string;
    enrolledAt: string;
  }>;
}

export const metricsService = {
  async getMetrics(): Promise<MetricsData> {
    try {
      const data = await apiClient.get('/metrics') as MetricsData;
      return data;
    } catch (error) {
      console.error('Error en metricsService.getMetrics:', error);
      throw error;
    }
  },
};