/**
 * UI Types - Stable interfaces for frontend components
 * These types represent the final shape of data consumed by UI components,
 * after adaptation from backend DTOs and business logic processing.
 */

// Activity UI representation with derived flags and formatted data
export interface ActivityUI {
  id: string;
  title: string;
  type: 'CHARLA' | 'TALLER' | 'COMPETENCIA';
  location: string;
  startsAt: string; // ISO string from backend
  endsAt: string; // ISO string from backend
  capacity: number;
  registeredCount: number;
  seatsLeft: number;
  isFull: boolean;
  isActive: boolean;
  
  // Optional derived flags (calculated in adapters)
  isSoon?: boolean; // starts within next 30 minutes
  isOngoing?: boolean; // currently happening
  isPast?: boolean; // already finished
  
  // Optional additional fields
  description?: string;
  instructor?: string;
  requirements?: string[];
  requiresEnrollment?: boolean;
}

// Authenticated user UI representation
export interface AuthUserUI {
  id: string;
  email: string;
  fullName: string;
  isUmg: boolean;
  organizationName?: string;
  roleLevel: number; // 0=Student, 1=Asistente, 2=Admin, 3=AdminDev
  roles: string[]; // Array of role names
  
  // Optional fields
  profileType?: 'staff' | 'student';
  staffRole?: 'AdminDev' | 'Admin' | 'Asistente';
  image?: string;
  createdAt?: string; // ISO string
}

// Enrollment UI representation with activity details
export interface EnrollmentUI {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  organizationName?: string;
  seatNumber?: string;
  qrCodeId: string;
  attended: boolean;
  
  // Activity details embedded for UI convenience
  activityId: string;
  activityTitle: string;
  activityType: 'CHARLA' | 'TALLER' | 'COMPETENCIA';
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  location: string;
  
  // Enrollment metadata
  enrolledAt: string; // ISO string
  status: 'active' | 'cancelled' | 'completed';
  
  // Optional fields
  attendedAt?: string; // ISO string
  instructor?: string;
}

// Error UI representation for consistent error handling
export interface ErrorUI {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  action?: string; // Suggested action for user
  correlationId?: string; // For debugging
}

// Response wrapper for service calls
export interface ServiceResponse<T> {
  data?: T;
  error?: ErrorUI;
  success: boolean;
  fromFallback?: boolean;
}

// Common list response
export interface ListResponse<T> {
  items: T[];
  total?: number;
  hasMore?: boolean;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter parameters for activities
export interface ActivityFilters {
  type?: 'CHARLA' | 'TALLER' | 'COMPETENCIA' | 'all';
  isActive?: boolean;
  hasSeats?: boolean;
  dateRange?: {
    start: string; // ISO string
    end: string; // ISO string
  };
}