import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/apiConfig';
import useSWR from 'swr';

// Interfaces para tipos de datos de staff
export interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleId: number;
  department?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface StaffInvitation {
  userId: string;
  email: string;
  role: string;
  status: string;
  invitationToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface StaffInviteRequest {
  email: string;
  role: string;
  message?: string;
}

export interface StaffInviteResponse {
  userId: string;
  email: string;
  role: string;
  status: string;
  invitationToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface StaffStats {
  totalParticipants: number;
  totalActivities: number;
  todayAttendance: number;
  pendingTasks: number;
  totalStaff?: number;
  activeStaff?: number;
  pendingInvitations?: number;
  acceptedInvitations?: number;
}

export interface QRScanRequest {
  qrCode: string;
  activityId?: string;
  userId?: string;
}

export interface QRScanResponse {
  success: boolean;
  message: string;
  userId?: string;
  userName?: string;
  activityTitle?: string;
  checkInTime?: string;
  attendanceId?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  activityId: string;
  activityTitle: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late';
}

export interface AttendanceHistoryResponse {
  records: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateRoleRequest {
  role: string;
}

export interface UpdateStatusRequest {
  isActive: boolean;
}

export interface PagedStaffResponse {
  staff: StaffMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User management interfaces
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profile?: {
    avatar?: string;
    bio?: string;
    organization?: string;
  };
}

export interface PagedUsersResponse {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

// Staff Service with SWR hooks
export const useStaffStats = () => {
  const { data, error, isLoading } = useSWR<StaffStats>(
    API_ENDPOINTS.STAFF.STATS,
    fetcher
  );

  return {
    stats: data,
    isLoading,
    error
  };
};

export const useStaffInvitations = () => {
  const { data, error, isLoading, mutate } = useSWR<StaffInvitation[]>(
    API_ENDPOINTS.STAFF.INVITATIONS,
    fetcher
  );

  return {
    invitations: data || [],
    isLoading,
    error,
    mutate
  };
};

export const useStaffMembers = (page = 1, limit = 10, search?: string, role?: string, status?: 'active' | 'inactive') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(role && { role }),
    ...(status && { status })
  });

  const { data, error, isLoading, mutate } = useSWR<PagedStaffResponse>(
    `${API_ENDPOINTS.STAFF.ALL}?${params}`,
    fetcher
  );

  return {
    staff: data?.staff || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate
  };
};

export const useAttendanceHistory = (
  page = 1,
  limit = 10,
  userId?: string,
  activityId?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(userId && { userId }),
    ...(activityId && { activityId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate })
  });

  // Usar tipo amplio para tolerar ambas formas: lista plana o objeto paginado
  const { data, error, isLoading, mutate } = useSWR<any>(
    `${API_ENDPOINTS.STAFF.ATTENDANCE_HISTORY}?${params}`,
    fetcher
  );

  // Normalizar registros al formato AttendanceRecord esperado por el frontend
  const rawList = Array.isArray(data) ? data : (data?.records || []);
  const normalizedRecords: AttendanceRecord[] = (rawList || []).map((r: any) => ({
    id: r.id ?? r.Id ?? '',
    userId: r.userId ?? r.UserId ?? '',
    userName: r.userName ?? r.ParticipantName ?? r.participantName ?? '',
    activityId: r.activityId ?? r.ActivityId ?? '',
    activityTitle: r.activityTitle ?? r.ActivityTitle ?? '',
    checkInTime: r.checkInTime ?? r.ActivityStartTime ?? r.activityStartTime ?? '',
    checkOutTime: r.checkOutTime ?? undefined,
    status: (r.status ?? 'present') as 'present' | 'absent' | 'late',
  }));

  const total = Array.isArray(data) ? normalizedRecords.length : (data?.total ?? normalizedRecords.length);
  const totalPages = Array.isArray(data) ? 1 : (data?.totalPages ?? 1);

  return {
    records: normalizedRecords,
    total,
    totalPages,
    isLoading,
    error,
    mutate
  };
};

// User Service with SWR hooks
export const useUsers = (page = 1, pageSize = 10, filters?: {
  search?: string;
  role?: string;
  isActive?: boolean;
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.role && { role: filters.role }),
    ...(filters?.isActive !== undefined && { isActive: filters.isActive.toString() })
  });

  const { data, error, isLoading, mutate } = useSWR<PagedUsersResponse>(
    `${API_ENDPOINTS.USERS.LIST}?${params}`,
    fetcher
  );

  return {
    users: data?.users || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate
  };
};

// API functions with error handling
export const scanQR = async (qrData: QRScanRequest): Promise<QRScanResponse> => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.STAFF.SCAN, qrData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al escanear QR';
    throw new Error(message);
  }
};

export const inviteStaff = async (inviteData: StaffInviteRequest): Promise<StaffInviteResponse> => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.STAFF.INVITE, inviteData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al invitar staff';
    throw new Error(message);
  }
};

export const revokeInvitation = async (invitationId: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.STAFF.REVOKE(invitationId));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al revocar invitación';
    throw new Error(message);
  }
};

export const updateStaffRole = async (staffId: string, roleData: UpdateRoleRequest): Promise<StaffMember> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.STAFF.UPDATE_ROLE(staffId), roleData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar rol';
    throw new Error(message);
  }
};

export const updateStaffStatus = async (staffId: string, statusData: UpdateStatusRequest): Promise<StaffMember> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.STAFF.UPDATE_STATUS(staffId), statusData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar estado';
    throw new Error(message);
  }
};

// User management functions
export const updateUserRole = async (userId: string, roleData: UpdateUserRoleRequest): Promise<User> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(userId), roleData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar rol del usuario';
    throw new Error(message);
  }
};

export const updateUserStatus = async (userId: string, statusData: UpdateUserStatusRequest): Promise<User> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(userId), statusData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar estado del usuario';
    throw new Error(message);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al eliminar usuario';
    throw new Error(message);
  }
};

// Validation utilities
export const StaffValidation = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidQRCode: (qrCode: string): boolean => {
    return qrCode.trim().length > 0 && qrCode.trim().length <= 500;
  },

  validateInviteRequest: (request: StaffInviteRequest): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!StaffValidation.isValidEmail(request.email)) {
      errors.push('El formato del email es inválido');
    }

    if (!request.role || request.role.trim().length === 0) {
      errors.push('El rol es requerido');
    }

    return { isValid: errors.length === 0, errors };
  }
};