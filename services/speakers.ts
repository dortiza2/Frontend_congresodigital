import { apiClient, safeGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';

// Admin/internal speaker shape (used in dashboard)
export interface Speaker {
  id: string;
  fullName: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  links?: string; // JSON string with social links
  createdAt?: string;
  updatedAt?: string;
}

// Public speaker shape expected by the landing
export interface PublicSpeaker {
  id: string;
  name: string;
  bio?: string;
  company?: string;
  roleTitle?: string;
  avatarUrl: string;
  links?: Record<string, any> | string; // tolerate both object and JSON string from API
}

export interface CreateSpeakerRequest {
  fullName: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  links?: string;
}

export interface UpdateSpeakerRequest {
  fullName?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  links?: string;
}

export interface SpeakerListResponse {
  data: Speaker[];
  total: number;
}

// Servicio de Speakers
export class SpeakerService {
  // Admin: Obtener todos los speakers
  static async getSpeakers(): Promise<Speaker[]> {
    const response = await apiClient.get(API_ENDPOINTS.SPEAKERS.LIST);
    return response;
  }

  // Obtener speakers públicos desde API real
  static async getPublicSpeakers(): Promise<PublicSpeaker[]> {
    const res = await safeGet<any>(API_ENDPOINTS.SPEAKERS.PUBLIC_LIST);
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((s: any) => {
        let links: Record<string, any> | string | undefined = s.links;
        if (typeof links === 'string') {
          try { links = JSON.parse(links); } catch { /* keep string */ }
        }
        return {
          id: String(s.id ?? s.speakerId ?? ''),
          name: s.name ?? s.fullName ?? 'Sin nombre',
          bio: s.bio ?? undefined,
          company: s.company ?? undefined,
          roleTitle: s.roleTitle ?? s.title ?? undefined,
          avatarUrl: s.avatarUrl ?? s.photoUrl ?? '',
          links
        } as PublicSpeaker;
      });
    }
    return [];
  }

  // Admin: Obtener speaker por ID
  static async getSpeakerById(id: string): Promise<Speaker> {
    const response = await apiClient.get(API_ENDPOINTS.SPEAKERS.GET_BY_ID(id));
    return response;
  }

  // Admin: Crear nuevo speaker
  static async createSpeaker(speakerData: CreateSpeakerRequest): Promise<Speaker> {
    const response = await apiClient.post(API_ENDPOINTS.SPEAKERS.CREATE, speakerData);
    return response;
  }

  // Admin: Actualizar speaker
  static async updateSpeaker(id: string, speakerData: UpdateSpeakerRequest): Promise<Speaker> {
    const response = await apiClient.put(API_ENDPOINTS.SPEAKERS.UPDATE(id), speakerData);
    return response;
  }

  // Admin: Eliminar speaker
  static async deleteSpeaker(id: string): Promise<void> {
    await apiClient.del(API_ENDPOINTS.SPEAKERS.DELETE(id));
  }
}

// Hook para usar el servicio de speakers
export const useSpeakerService = () => {
  return {
    getSpeakers: SpeakerService.getSpeakers,
    getPublicSpeakers: SpeakerService.getPublicSpeakers,
    getSpeakerById: SpeakerService.getSpeakerById,
    createSpeaker: SpeakerService.createSpeaker,
    updateSpeaker: SpeakerService.updateSpeaker,
    deleteSpeaker: SpeakerService.deleteSpeaker
  };
};

// Validaciones para speakers
export const SpeakerValidation = {
  validateFullName: (fullName: string): string | null => {
    if (!fullName || fullName.trim().length < 2) {
      return 'El nombre completo debe tener al menos 2 caracteres';
    }
    if (fullName.length > 100) {
      return 'El nombre completo no puede exceder 100 caracteres';
    }
    return null;
  },

  validateTitle: (title?: string): string | null => {
    if (title && title.length > 150) {
      return 'El título no puede exceder 150 caracteres';
    }
    return null;
  },

  validateBio: (bio?: string): string | null => {
    if (bio && bio.length > 1000) {
      return 'La biografía no puede exceder 1000 caracteres';
    }
    return null;
  },

  validateAvatarUrl: (avatarUrl?: string): string | null => {
    if (avatarUrl && !avatarUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
      return 'La URL del avatar debe ser una imagen válida (jpg, jpeg, png, gif, webp)';
    }
    return null;
  },

  validateLinks: (links?: string): string | null => {
    if (links) {
      try {
        JSON.parse(links);
        return null;
      } catch {
        return 'Los enlaces deben ser un JSON válido';
      }
    }
    return null;
  }
};

// Mantener compatibilidad con código existente
export const getSpeakers = SpeakerService.getPublicSpeakers;