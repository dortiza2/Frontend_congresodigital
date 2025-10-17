import { useState, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault?: boolean;
}

const defaultCategories: Category[] = [
  {
    id: '1',
    name: 'Frontend',
    description: 'Desarrollo de interfaces de usuario',
    color: '#3B82F6',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Backend',
    description: 'Desarrollo del lado del servidor',
    color: '#10B981',
    isDefault: true,
  },
  {
    id: '3',
    name: 'Full Stack',
    description: 'Desarrollo completo frontend y backend',
    color: '#8B5CF6',
    isDefault: true,
  },
  {
    id: '4',
    name: 'Data Science',
    description: 'Ciencia de datos y análisis',
    color: '#F59E0B',
    isDefault: true,
  },
  {
    id: '5',
    name: 'DevOps',
    description: 'Operaciones y desarrollo',
    color: '#EF4444',
    isDefault: true,
  },
  {
    id: '6',
    name: 'Mobile',
    description: 'Desarrollo móvil',
    color: '#06B6D4',
    isDefault: true,
  },
  {
    id: '7',
    name: 'UX/UI',
    description: 'Experiencia y diseño de usuario',
    color: '#EC4899',
    isDefault: true,
  },
  {
    id: '8',
    name: 'Blockchain',
    description: 'Tecnología blockchain y criptomonedas',
    color: '#F97316',
    isDefault: true,
  },
  {
    id: '9',
    name: 'Cybersecurity',
    description: 'Seguridad informática',
    color: '#84CC16',
    isDefault: true,
  },
  {
    id: '10',
    name: 'Cloud Computing',
    description: 'Computación en la nube',
    color: '#6B7280',
    isDefault: true,
  },
];

const STORAGE_KEY = 'workshop_categories';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar categorías desde localStorage al inicializar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedCategories = JSON.parse(stored);
        setCategories(parsedCategories);
      } else {
        // Si no hay categorías guardadas, usar las por defecto
        setCategories(defaultCategories);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(defaultCategories);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar categorías en localStorage cuando cambien
  const updateCategories = (newCategories: Category[]) => {
    try {
      setCategories(newCategories);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  };

  // Obtener categoría por ID
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };

  // Obtener categoría por nombre
  const getCategoryByName = (name: string): Category | undefined => {
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  };

  // Obtener solo los nombres de las categorías (para compatibilidad con código existente)
  const getCategoryNames = (): string[] => {
    return categories.map(cat => cat.name);
  };

  // Resetear a categorías por defecto
  const resetToDefaults = () => {
    updateCategories(defaultCategories);
  };

  // Verificar si una categoría existe
  const categoryExists = (name: string, excludeId?: string): boolean => {
    return categories.some(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && 
      cat.id !== excludeId
    );
  };

  // Obtener estadísticas de categorías
  const getCategoryStats = () => {
    return {
      total: categories.length,
      default: categories.filter(cat => cat.isDefault).length,
      custom: categories.filter(cat => !cat.isDefault).length,
    };
  };

  return {
    categories,
    isLoading,
    updateCategories,
    getCategoryById,
    getCategoryByName,
    getCategoryNames,
    resetToDefaults,
    categoryExists,
    getCategoryStats,
  };
};