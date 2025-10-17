// Tipos
export type Placement = {
  place: 1 | 2 | 3;
  team: string;        // equipo o persona
  members?: string[];  // solo si aplica
  project?: string;    // opcional
  image?: string;
  details?: string;
};

export type ActivityWinners = {
  activity: string;
  placements: Placement[]; // exactamente 3
};

export type YearWinners = ActivityWinners[];

// Datos
export const winnersByYear: Record<string, YearWinners> = {
  "2024": [
    {
      activity: "Pelea de robots",
      placements: [
        { 
          place: 1, 
          team: "Sanarate", 
          members: ["Axel Lemus", "Brenda Flores", "Diego Méndez"],
          image: "/uploads/speakers/perfil1.svg",
          details: "Equipo especializado en robótica de combate con sistema de navegación autónoma y estrategias de ataque adaptativas."
        },
        { 
          place: 2, 
          team: "Guastatoya", 
          members: ["María Pérez", "Luis García", "Kevin López"],
          image: "/uploads/speakers/perfil1.svg",
          details: "Desarrolladores de inteligencia artificial aplicada a robótica de combate con algoritmos de aprendizaje automático."
        },
        { 
          place: 3, 
          team: "Sanarate", 
          members: ["Esteban Morales", "Sofía Ramírez", "Pablo Herrera"],
          image: "/uploads/speakers/perfil1.svg",
          details: "Equipo enfocado en estrategias defensivas y maniobras tácticas para competencias de robótica."
        },
      ],
    },
    {
      activity: "Competencia de programación",
      placements: [
        { 
          place: 1, 
          team: "pythons", 
          members: ["Andrea Ruiz", "Jorge Castillo", "Carlos Gómez"],
          image: "/uploads/speakers/perfil1.svg",
          details: "Equipo especializado en Python con experiencia en desarrollo web, análisis de datos y algoritmos de machine learning."
        },
        { 
          place: 2, 
          team: "El club del código", 
          members: ["Valeria Soto", "Ricardo Díaz", "Henry López"],
          image: "/uploads/speakers/perfil1.svg",
          details: "Desarrolladores versátiles con conocimientos en múltiples lenguajes y metodologías ágiles de desarrollo."
        },
        { 
          place: 3, 
          team: "C#power", 
          members: ["Santiago Ortiz", "Daniela Chávez", "Fernando Mejía"],
          image: "/uploads/speakers/perfil1.svg",
          details: "Especialistas en tecnologías Microsoft y desarrollo de aplicaciones empresariales con C# y .NET Framework."
        },
      ],
    },
    {
      activity: "Competencia de Matemáticas avanzadas",
      placements: [
        { place: 1, team: "Wilmer Aguirre", image: "/uploads/speakers/perfil1.svg" },
        { place: 2, team: "Samanta Wonder", image: "/uploads/speakers/perfil1.svg" },
        { place: 3, team: "Helena Aguirr", image: "/uploads/speakers/perfil1.svg" },
      ],
    },
  ],
  "2025": [], // sin datos → mostrará "En espera…"
};