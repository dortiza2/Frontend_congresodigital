// Tipos para el sistema de autenticación e inscripciones

export interface User {
  id: string;
  name: string;
  email: string;
  organization?: string;
  roles?: string[]; // Mantenido para compatibilidad con código existente
  roleLevel?: number; // 3=AdminDev, 2=Admin, 1=Asistente, 0=Student
  image?: string;
  attended?: boolean;
  createdAt?: Date;
  // Nuevas propiedades del modelo de identidad única
  profileType?: 'staff' | 'student';
  staffRole?: 'AdminDev' | 'Admin' | 'Asistente';
  isUmg?: boolean;
  fullName?: string;
}

export interface Activity {
  id: string;
  title: string;
  kind: 'taller' | 'competencia' | 'conferencia';
  location: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  capacity: number;
  enrolled: number;
  description?: string;
  instructor?: string;
  requirements?: string[];
}

export interface Enrollment {
  id: string;
  userId: string;
  activityId: string;
  seatNumber: string;
  qrCodeId: string;
  enrolledAt: Date;
  attended?: boolean;
  attendedAt?: string; // Agregar propiedad para fecha de asistencia
}

// Tipos para respuestas de API
export interface LoginResponse {
  user: User;
  token?: string;
}

export interface EnrollmentResponse {
  enrollments: Enrollment[];
  success: boolean;
  message?: string;
}

// Tipos para el contexto de autenticación
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginEmail: (email: string, password: string) => Promise<User>;
  loginGoogle: (email: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Tipos para errores
export interface AuthError {
  code: string;
  message: string;
}

export interface ValidationError {
  field: string;
  message: string;
}