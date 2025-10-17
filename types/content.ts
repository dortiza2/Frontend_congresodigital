// Tipos centralizados para el contenido del congreso
// Estos tipos definen los contratos de datos que se usarán
// tanto en la fase de stubs (F2) como en la migración a DB (F3-F5)

export interface CongressInfo {
  title: string;
  summary: string; // maxChars recomendado: 200
  mainImageUrl: string;
  lastUpdated: string; // ISO string
}

export interface Speaker {
  id: string;
  name: string;
  topic: string;
  bioShort: string; // maxChars recomendado: 150
  photoUrl: string;
  priority: number; // para ordenamiento
}

export interface AgendaItem {
  id: string;
  type: 'actividad' | 'charla';
  title: string;
  speakerId?: string; // referencia a Speaker.id
  startISO: string; // ISO datetime
  endISO: string; // ISO datetime
  place?: string;
  day: string; // formato 'YYYY-MM-DD'
}

export interface ActivityCard {
  id: string;
  title: string;
  imageUrl: string;
  short: string; // descripción corta
  description?: string; // descripción más larga para mostrar en tarjetas
  link?: string; // enlace opcional
}

export interface Winner {
  id: string;
  year: number;
  activityId: string; // referencia a ActivityCard.id
  place: 1 | 2 | 3; // posición en el ranking
  projectName?: string;
  projectShort?: string; // descripción del proyecto
  photoUrl: string; // foto del equipo/proyecto
  team?: {
    name: string; // nombre del equipo
    members: Array<{
      fullName: string;
      photoUrl?: string;
    }>;
  };
}

export interface CareerInfo {
  heading: string;
  body: string; // texto descriptivo
  links: Array<{
    label: string;
    url: string;
  }>;
}

// Tipos auxiliares para el estado de la agenda
export interface AgendaStatus {
  current?: AgendaItem; // evento actual en curso
  next?: AgendaItem; // próximo evento
  isEventDay: boolean; // si hoy hay eventos
}

// Tipos para respuestas de API (futuro F3-F5)
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message?: string;
}