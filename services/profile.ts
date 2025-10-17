import { apiClient } from '@/lib/api';

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  profileType: 'staff' | 'student';
  staffRole?: 'AdminDev' | 'Admin' | 'Asistente';
  isUmg: boolean;
  orgName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrVerificationRequest {
  qrCodeId: string;
}

export interface QrVerificationResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    isUmg: boolean;
    orgName?: string;
  };
  activity?: {
    id: string;
    title: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  enrollment?: {
    id: string;
    seatNumber: string;
    attended: boolean;
  };
  attendanceStats?: {
    totalEnrolled: number;
    totalAttended: number;
    capacityUtilization: number;
  };
}

/**
 * Obtiene el perfil del usuario autenticado
 */
export async function getUserProfile(): Promise<UserProfileResponse> {
  return apiClient.get('/profile');
}

/**
 * Actualiza el perfil del usuario
 */
export async function updateUserProfile(profileData: Partial<UserProfileResponse>): Promise<UserProfileResponse> {
  return apiClient.post('/api/profile', profileData);
}

/**
 * Verifica un código QR para marcar asistencia
 */
export async function verifyQrCode(qrCodeId: string): Promise<QrVerificationResponse> {
  return apiClient.post('/api/qr/verify', { qrCodeId });
}

/**
 * Obtiene estadísticas de asistencia para staff
 */
export async function getAttendanceStats(): Promise<any> {
  return apiClient.get('/qr/stats');
}

/**
 * Obtiene el historial de verificaciones QR para staff
 */
export async function getQrHistory(): Promise<any> {
  return apiClient.get('/qr/history');
}