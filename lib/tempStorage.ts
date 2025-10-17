/**
 * Servicio de almacenamiento temporal con soporte para API real
 * Maneja datos de contacto y registro con fallback a localStorage
 */

import { API_ENDPOINTS, buildApiUrl, getAuthHeaders, handleApiError, USE_MOCK_DATA } from '@/lib/apiConfig';

export interface ContactFormData {
  email: string;
  nombre?: string;
  mensaje?: string;
  timestamp: string;
  source: string;
}

export interface RegistrationData {
  email: string;
  nombre: string;
  actividades: string[];
  telefono: string;
  colegio: string;
  tipo: 'interno' | 'externo';
  timestamp: string;
  registro_inscripcion: string;
}

/**
 * Guardar email de contacto
 */
export const saveContactEmail = async (email: string, source: string = 'general'): Promise<boolean> => {
  const contactData: ContactFormData = {
    email,
    timestamp: new Date().toISOString(),
    source
  };

  if (USE_MOCK_DATA) {
    // Modo mock: usar localStorage
    try {
      const existingData = JSON.parse(localStorage.getItem('contact_emails') || '[]');
      existingData.push(contactData);
      localStorage.setItem('contact_emails', JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error('Error saving contact email:', error);
      return false;
    }
  }

  // Modo API real
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.CONTACTS.CREATE), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      throw new Error('Error al guardar contacto');
    }

    return true;
  } catch (error: any) {
    console.error('Error saving contact via API:', handleApiError(error));
    
    // Fallback a localStorage si falla la API
    try {
      const existingData = JSON.parse(localStorage.getItem('contact_emails') || '[]');
      existingData.push(contactData);
      localStorage.setItem('contact_emails', JSON.stringify(existingData));
      return true;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return false;
    }
  }
};

/**
 * Guardar datos de registro
 */
export const saveRegistrationData = async (data: Omit<RegistrationData, 'timestamp' | 'registro_inscripcion'>): Promise<string | null> => {
  const registrationData: RegistrationData = {
    ...data,
    timestamp: new Date().toISOString(),
    registro_inscripcion: `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  if (USE_MOCK_DATA) {
    // Modo mock: usar localStorage
    try {
      const existingData = JSON.parse(localStorage.getItem('registrations') || '[]');
      existingData.push(registrationData);
      localStorage.setItem('registrations', JSON.stringify(existingData));
      return registrationData.registro_inscripcion;
    } catch (error) {
      console.error('Error saving registration data:', error);
      return null;
    }
  }

  // Modo API real
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.REGISTRATIONS.CREATE), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(registrationData)
    });

    if (!response.ok) {
      throw new Error('Error al guardar registro');
    }

    const result = await response.json();
    return result.registro_inscripcion || registrationData.registro_inscripcion;
  } catch (error: any) {
    console.error('Error saving registration via API:', handleApiError(error));
    
    // Fallback a localStorage si falla la API
    try {
      const existingData = JSON.parse(localStorage.getItem('registrations') || '[]');
      existingData.push(registrationData);
      localStorage.setItem('registrations', JSON.stringify(existingData));
      return registrationData.registro_inscripcion;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      return null;
    }
  }
};

/**
 * Obtener datos almacenados
 */
export const getStoredData = async (key: string): Promise<any[]> => {
  if (USE_MOCK_DATA) {
    // Modo mock: usar localStorage
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.error('Error getting stored data:', error);
      return [];
    }
  }

  // Modo API real
  try {
    let endpoint = '';
    switch (key) {
      case 'contact_emails':
        endpoint = API_ENDPOINTS.CONTACTS.LIST;
        break;
      case 'registrations':
        endpoint = API_ENDPOINTS.REGISTRATIONS.LIST;
        break;
      default:
        // Fallback a localStorage para keys no reconocidas
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    const response = await fetch(buildApiUrl(endpoint), {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener datos');
    }

    const result = await response.json();
    return result.data || result;
  } catch (error: any) {
    console.error('Error getting data via API:', handleApiError(error));
    
    // Fallback a localStorage si falla la API
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (localError) {
      console.error('Error getting from localStorage:', localError);
      return [];
    }
  }
};

/**
 * Limpiar datos almacenados
 */
export const clearStoredData = async (key: string): Promise<boolean> => {
  if (USE_MOCK_DATA) {
    // Modo mock: limpiar localStorage
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing stored data:', error);
      return false;
    }
  }

  // Modo API real
  try {
    let endpoint = '';
    switch (key) {
      case 'contact_emails':
        endpoint = API_ENDPOINTS.CONTACTS.CLEAR;
        break;
      case 'registrations':
        endpoint = API_ENDPOINTS.REGISTRATIONS.CLEAR;
        break;
      default:
        // Fallback a localStorage para keys no reconocidas
        localStorage.removeItem(key);
        return true;
    }

    const response = await fetch(buildApiUrl(endpoint), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al limpiar datos');
    }

    return true;
  } catch (error: any) {
    console.error('Error clearing data via API:', handleApiError(error));
    
    // Fallback a localStorage si falla la API
    try {
      localStorage.removeItem(key);
      return true;
    } catch (localError) {
      console.error('Error clearing from localStorage:', localError);
      return false;
    }
  }
};

/**
 * Exportar todos los datos
 */
export const exportAllData = async (): Promise<{ contacts: ContactFormData[], registrations: RegistrationData[] }> => {
  try {
    const [contacts, registrations] = await Promise.all([
      getStoredData('contact_emails'),
      getStoredData('registrations')
    ]);

    return {
      contacts: contacts as ContactFormData[],
      registrations: registrations as RegistrationData[]
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { contacts: [], registrations: [] };
  }
};