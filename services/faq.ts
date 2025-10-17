import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
  published: boolean;
  position: number;
};

export const getFaq = (): Promise<FaqItem[]> => apiClient.get(API_ENDPOINTS.FAQ.LIST);