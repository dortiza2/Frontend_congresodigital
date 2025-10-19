import type { PodiumItem } from '@/services/podium';
import type { ActivityCard } from '@/types/content';
import type { PodiumItemDTO } from '@/lib/api';

const CURRENT_YEAR = new Date().getFullYear();

export const mockActivities: ActivityCard[] = [
  {
    id: 'robotics',
    title: 'Competencia de Robótica',
    imageUrl: '/images/default-activity.jpg',
    short: 'competencia',
    description: 'Actividad de tipo competencia',
    link: '#'
  },
  {
    id: 'mathematics',
    title: 'Competencia de Matemáticas',
    imageUrl: '/images/default-activity.jpg',
    short: 'competencia',
    description: 'Actividad de tipo competencia',
    link: '#'
  },
  {
    id: 'programacion2',
    title: 'Programación 2',
    imageUrl: '/images/default-activity.jpg',
    short: 'competencia',
    description: 'Actividad de tipo competencia',
    link: '#'
  }
];

export function getMockPodiumByYear(year: number = CURRENT_YEAR): PodiumItem[] {
  const y = Number.isFinite(year) ? year : CURRENT_YEAR;
  return [
    // Competencia de Robótica
    { year: y, place: 1, activityId: 'robotics', activityTitle: 'Competencia de Robótica', winnerName: 'Equipo NeoBot', prizeDescription: 'Robot autónomo de alto rendimiento' },
    { year: y, place: 2, activityId: 'robotics', activityTitle: 'Competencia de Robótica', winnerName: 'Equipo RoboMinds', prizeDescription: 'Estrategias de navegación inteligente' },
    { year: y, place: 3, activityId: 'robotics', activityTitle: 'Competencia de Robótica', winnerName: 'Equipo TechnoGear', prizeDescription: 'Diseño mecánico optimizado' },

    // Competencia de Matemáticas
    { year: y, place: 1, activityId: 'mathematics', activityTitle: 'Competencia de Matemáticas', winnerName: 'Ana Torres', prizeDescription: 'Resolución de problemas avanzados' },
    { year: y, place: 2, activityId: 'mathematics', activityTitle: 'Competencia de Matemáticas', winnerName: 'Luis Mitre', prizeDescription: 'Modelo probabilístico aplicado' },
    { year: y, place: 3, activityId: 'mathematics', activityTitle: 'Competencia de Matemáticas', winnerName: 'Carla Gómez', prizeDescription: 'Geometría y optimización' },

    // Programación 2
    { year: y, place: 1, activityId: 'programacion2', activityTitle: 'Programación 2', winnerName: 'Team ByteForce', prizeDescription: 'Sistema de colas distribuido' },
    { year: y, place: 2, activityId: 'programacion2', activityTitle: 'Programación 2', winnerName: 'Team DevMasters', prizeDescription: 'Motor de plantillas eficiente' },
    { year: y, place: 3, activityId: 'programacion2', activityTitle: 'Programación 2', winnerName: 'Team CodeWave', prizeDescription: 'CLI multiplataforma robusta' }
  ];
}

export function getMockPodiumDTOByYear(year: number = CURRENT_YEAR): PodiumItemDTO[] {
  const items = getMockPodiumByYear(year);
  return items.map(i => ({
    year: i.year,
    place: i.place,
    activityId: i.activityId,
    activityTitle: i.activityTitle,
    winnerName: i.winnerName,
  }));
}