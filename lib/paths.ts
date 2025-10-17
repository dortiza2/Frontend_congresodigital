// Image path constants for standardized asset management
// These paths can be easily updated when migrating to BD/object-storage

export const UPLOADS_BASE = "/uploads";

// Image directories
export const CONGRESS_IMG = "/uploads/congress";
export const SPEAKERS_IMG = "/uploads/speakers";
export const ACTIVITIES_IMG = "/uploads/activities";
export const WINNERS_IMG = "/uploads/winners";
export const SPONSORS_IMG = "/uploads/sponsors";
export const MISC_IMG = "/uploads/misc";

// Specific image paths
export const CONGRESS_HERO = `${CONGRESS_IMG}/hero.jpg`;
export const SPEAKER_PROFILE_1 = `${SPEAKERS_IMG}/perfil1.svg`;

// Helper function to build image paths
export const buildImagePath = (category: string, filename: string): string => {
  return `${UPLOADS_BASE}/${category}/${filename}`;
};

// Image categories enum for type safety
export enum ImageCategory {
  CONGRESS = 'congress',
  SPEAKERS = 'speakers',
  ACTIVITIES = 'activities',
  WINNERS = 'winners',
  SPONSORS = 'sponsors',
  MISC = 'misc'
}