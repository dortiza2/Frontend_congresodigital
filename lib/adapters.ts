/**
 * Data Adapters - Convert backend DTOs to UI types
 * Handles GUID to string conversion, field mapping, and derived calculations
 */

import { ActivityUI, AuthUserUI, EnrollmentUI } from '@/types/ui';

// Backend DTO types (raw from API)
interface ActivityDTO {
  id: string | number;
  title: string;
  activityType?: string;
  type?: string;
  location?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  published?: boolean;
  isActive?: boolean;
  enrolledCount?: number;
  enrolled?: number;
  availableSpots?: number;
  description?: string;
  instructor?: string;
  requirements?: string[];
  requiresEnrollment?: boolean;
}

interface AuthUserDTO {
  id: string | number;
  email: string;
  fullName?: string;
  name?: string;
  isUmg?: boolean;
  orgName?: string;
  organization?: string;
  organizationName?: string;
  roleLevel?: number;
  roles?: string[];
  profileType?: 'staff' | 'student';
  staffRole?: 'AdminDev' | 'Admin' | 'Asistente';
  image?: string;
  createdAt?: string;
}

interface EnrollmentDTO {
  id: string | number;
  userId: string | number;
  userEmail?: string;
  userFullName?: string;
  organizationName?: string;
  seatNumber?: string;
  qrToken?: string;
  qrCodeId?: string;
  attended?: boolean;
  activityId: string | number;
  activityTitle?: string;
  activityType?: string;
  activityKind?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  enrolledAt: string;
  status?: string;
  attendedAt?: string;
  instructor?: string;
}

// Utility functions
function toSafeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

function toSafeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function toSafeBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
}

function normalizeActivityType(type?: string): 'CHARLA' | 'TALLER' | 'COMPETENCIA' {
  if (!type) return 'CHARLA';
  
  const normalized = type.toUpperCase().trim();
  switch (normalized) {
    case 'TALLER':
    case 'WORKSHOP':
      return 'TALLER';
    case 'COMPETENCIA':
    case 'COMPETITION':
      return 'COMPETENCIA';
    case 'CHARLA':
    case 'CONFERENCIA':
    case 'CONFERENCE':
    case 'TALK':
    default:
      return 'CHARLA';
  }
}

function calculateDerivedFlags(startsAt: string, endsAt: string) {
  const now = new Date();
  const startTime = new Date(startsAt);
  const endTime = new Date(endsAt);
  
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  
  return {
    isSoon: startTime <= thirtyMinutesFromNow && startTime > now,
    isOngoing: now >= startTime && now <= endTime,
    isPast: now > endTime
  };
}

/**
 * Convert Activity DTO to ActivityUI
 */
export function toActivity(dto: ActivityDTO): ActivityUI {
  const id = toSafeString(dto.id);
  const startsAt = dto.startTime;
  const endsAt = dto.endTime;
  const capacity = toSafeNumber(dto.capacity);
  const registeredCount = toSafeNumber(dto.enrolledCount || dto.enrolled);
  const seatsLeft = Math.max(0, capacity - registeredCount);
  const isFull = seatsLeft === 0;
  
  const derivedFlags = calculateDerivedFlags(startsAt, endsAt);
  
  return {
    id,
    title: toSafeString(dto.title),
    type: normalizeActivityType(dto.activityType || dto.type),
    location: toSafeString(dto.location),
    startsAt,
    endsAt,
    capacity,
    registeredCount,
    seatsLeft,
    isFull,
    isActive: toSafeBoolean(dto.isActive, true),
    ...derivedFlags,
    description: dto.description || undefined,
    instructor: dto.instructor || undefined,
    requirements: dto.requirements || undefined,
    requiresEnrollment: toSafeBoolean(dto.requiresEnrollment, true)
  };
}

/**
 * Convert AuthUser DTO to AuthUserUI
 */
export function toAuthUser(dto: AuthUserDTO): AuthUserUI {
  const organizationName = dto.orgName || dto.organization || dto.organizationName;
  
  return {
    id: toSafeString(dto.id),
    email: toSafeString(dto.email),
    fullName: toSafeString(dto.fullName || dto.name),
    isUmg: toSafeBoolean(dto.isUmg),
    organizationName: organizationName || undefined,
    roleLevel: toSafeNumber(dto.roleLevel),
    roles: dto.roles || [],
    profileType: dto.profileType,
    staffRole: dto.staffRole,
    image: dto.image || undefined,
    createdAt: dto.createdAt || undefined
  };
}

/**
 * Convert Enrollment DTO to EnrollmentUI
 */
export function toEnrollment(dto: EnrollmentDTO): EnrollmentUI {
  const activityType = normalizeActivityType(dto.activityType || dto.activityKind);
  
  // Normalize status
  let status: 'active' | 'cancelled' | 'completed' = 'active';
  if (dto.status) {
    const statusLower = dto.status.toLowerCase();
    if (statusLower.includes('cancel')) status = 'cancelled';
    else if (statusLower.includes('complet') || dto.attended) status = 'completed';
  }
  
  return {
    id: toSafeString(dto.id),
    userId: toSafeString(dto.userId),
    userEmail: toSafeString(dto.userEmail),
    userFullName: toSafeString(dto.userFullName),
    organizationName: dto.organizationName || undefined,
    seatNumber: dto.seatNumber || undefined,
    qrCodeId: toSafeString(dto.qrToken || dto.qrCodeId),
    attended: toSafeBoolean(dto.attended),
    activityId: toSafeString(dto.activityId),
    activityTitle: toSafeString(dto.activityTitle),
    activityType,
    startsAt: toSafeString(dto.startTime),
    endsAt: toSafeString(dto.endTime),
    location: toSafeString(dto.location),
    enrolledAt: dto.enrolledAt,
    status,
    attendedAt: dto.attendedAt || undefined,
    instructor: dto.instructor || undefined
  };
}

/**
 * Convert array of Activity DTOs to ActivityUI array
 */
export function toActivities(dtos: ActivityDTO[]): ActivityUI[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(toActivity);
}

/**
 * Convert array of Enrollment DTOs to EnrollmentUI array
 */
export function toEnrollments(dtos: EnrollmentDTO[]): EnrollmentUI[] {
  if (!Array.isArray(dtos)) return [];
  return dtos.map(toEnrollment);
}

// Re-export existing activity adapter for backward compatibility
export { adaptActivity, adaptActivities, type PublicActivity } from './adapters/activity';