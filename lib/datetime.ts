/**
 * Guatemala Timezone Formatting Utilities
 * Forces rendering in America/Guatemala timezone with es-GT locale
 */

// Guatemala timezone and locale constants
const GUATEMALA_TIMEZONE = 'America/Guatemala';
const GUATEMALA_LOCALE = 'es-GT';

/**
 * Converts ISO string to Date object in Guatemala timezone
 */
function toGuatemalaDate(isoString: string): Date {
  if (!isoString) {
    throw new Error('ISO string is required');
  }
  
  try {
    return new Date(isoString);
  } catch (error) {
    throw new Error(`Invalid ISO date string: ${isoString}`);
  }
}

/**
 * Formats date to Guatemala format: "5 de octubre de 2025"
 */
export function formatGT(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = toGuatemalaDate(isoString);
    return new Intl.DateTimeFormat(GUATEMALA_LOCALE, {
      timeZone: GUATEMALA_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.warn('Error formatting Guatemala date:', error);
    return isoString; // Fallback to original string
  }
}

/**
 * Formats time to Guatemala format: "13:45"
 */
export function formatGTTime(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = toGuatemalaDate(isoString);
    return new Intl.DateTimeFormat(GUATEMALA_LOCALE, {
      timeZone: GUATEMALA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.warn('Error formatting Guatemala time:', error);
    return isoString; // Fallback to original string
  }
}

/**
 * Formats datetime to Guatemala format: "5 de octubre de 2025 13:45"
 */
export function formatGTDateTime(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = toGuatemalaDate(isoString);
    return new Intl.DateTimeFormat(GUATEMALA_LOCALE, {
      timeZone: GUATEMALA_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.warn('Error formatting Guatemala datetime:', error);
    return isoString; // Fallback to original string
  }
}

/**
 * Formats date to short Guatemala format: "5/10/2025"
 */
export function formatGTShort(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = toGuatemalaDate(isoString);
    return new Intl.DateTimeFormat(GUATEMALA_LOCALE, {
      timeZone: GUATEMALA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.warn('Error formatting Guatemala short date:', error);
    return isoString; // Fallback to original string
  }
}

/**
 * Formats time with AM/PM to Guatemala format: "1:45 p. m."
 */
export function formatGTTime12(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = toGuatemalaDate(isoString);
    return new Intl.DateTimeFormat(GUATEMALA_LOCALE, {
      timeZone: GUATEMALA_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (error) {
    console.warn('Error formatting Guatemala 12-hour time:', error);
    return isoString; // Fallback to original string
  }
}

/**
 * Formats relative time: "hace 2 horas", "en 3 días"
 */
export function formatGTRelative(isoString: string): string {
  if (!isoString) return '';
  
  try {
    const date = toGuatemalaDate(isoString);
    const now = new Date();
    
    // Convert both dates to Guatemala timezone for comparison
    const guatemalaNow = new Date(now.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaDate = new Date(date.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    
    const rtf = new Intl.RelativeTimeFormat(GUATEMALA_LOCALE, { numeric: 'auto' });
    const diffInMs = guatemalaDate.getTime() - guatemalaNow.getTime();
    
    // Convert to appropriate unit
    const diffInMinutes = Math.round(diffInMs / (1000 * 60));
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    } else if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    } else {
      return rtf.format(diffInDays, 'day');
    }
  } catch (error) {
    console.warn('Error formatting Guatemala relative time:', error);
    return isoString; // Fallback to original string
  }
}

/**
 * Gets the current date/time in Guatemala timezone as ISO string
 */
export function nowInGuatemala(): string {
  const now = new Date();
  return now.toLocaleString('sv-SE', { timeZone: GUATEMALA_TIMEZONE }) + 'Z';
}

/**
 * Checks if a date is today in Guatemala timezone
 */
export function isToday(isoString: string): boolean {
  if (!isoString) return false;
  
  try {
    const date = toGuatemalaDate(isoString);
    const today = new Date();
    
    const guatemalaDate = new Date(date.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaToday = new Date(today.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    
    return guatemalaDate.toDateString() === guatemalaToday.toDateString();
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a date is tomorrow in Guatemala timezone
 */
export function isTomorrow(isoString: string): boolean {
  if (!isoString) return false;
  
  try {
    const date = toGuatemalaDate(isoString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const guatemalaDate = new Date(date.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaTomorrow = new Date(tomorrow.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    
    return guatemalaDate.toDateString() === guatemalaTomorrow.toDateString();
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a date is in the past in Guatemala timezone
 */
export function isPast(isoString: string): boolean {
  if (!isoString) return false;
  
  try {
    const date = toGuatemalaDate(isoString);
    const now = new Date();
    
    const guatemalaDate = new Date(date.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaNow = new Date(now.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    
    return guatemalaDate < guatemalaNow;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a date is in the future in Guatemala timezone
 */
export function isFuture(isoString: string): boolean {
  if (!isoString) return false;
  
  try {
    const date = toGuatemalaDate(isoString);
    const now = new Date();
    
    const guatemalaDate = new Date(date.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaNow = new Date(now.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    
    return guatemalaDate > guatemalaNow;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a date is within the next hour in Guatemala timezone
 */
export function isSoon(isoString: string, minutesThreshold: number = 60): boolean {
  if (!isoString) return false;
  
  try {
    const date = toGuatemalaDate(isoString);
    const now = new Date();
    
    const guatemalaDate = new Date(date.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaNow = new Date(now.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    
    const diffInMs = guatemalaDate.getTime() - guatemalaNow.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    
    return diffInMinutes > 0 && diffInMinutes <= minutesThreshold;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a date is currently ongoing (within a time range)
 */
export function isOngoing(startIso: string, endIso: string): boolean {
  if (!startIso || !endIso) return false;
  
  try {
    const startDate = toGuatemalaDate(startIso);
    const endDate = toGuatemalaDate(endIso);
    const now = new Date();
    
    const guatemalaStart = new Date(startDate.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaEnd = new Date(endDate.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    const guatemalaNow = new Date(now.toLocaleString('en-US', { timeZone: GUATEMALA_TIMEZONE }));
    
    return guatemalaNow >= guatemalaStart && guatemalaNow <= guatemalaEnd;
  } catch (error) {
    return false;
  }
}

/**
 * Formats a date range: "5 de octubre 13:45 - 15:30"
 */
export function formatGTDateRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return '';
  
  try {
    const startDate = formatGT(startIso);
    const startTime = formatGTTime(startIso);
    const endTime = formatGTTime(endIso);
    
    // Check if both dates are on the same day
    const startDay = formatGTShort(startIso);
    const endDay = formatGTShort(endIso);
    
    if (startDay === endDay) {
      return `${startDate} ${startTime} - ${endTime}`;
    } else {
      const endDate = formatGT(endIso);
      return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    }
  } catch (error) {
    console.warn('Error formatting Guatemala date range:', error);
    return `${startIso} - ${endIso}`; // Fallback
  }
}

/**
 * Utility to get timezone info
 */
export function getGuatemalaTimezoneInfo() {
  return {
    timezone: GUATEMALA_TIMEZONE,
    locale: GUATEMALA_LOCALE,
    offset: new Intl.DateTimeFormat('en', {
      timeZone: GUATEMALA_TIMEZONE,
      timeZoneName: 'longOffset'
    }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value || 'GMT-6'
  };
}