import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault?: boolean;
}

interface CategoriesManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  onCategoriesChange,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color: defaultColors[0],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!editForm.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (categories.some(cat => 
      cat.name.toLowerCase() === editForm.name.toLowerCase() && 
      cat.id !== isEditing
    )) {
      newErrors.name = 'Ya existe una categoría con este nombre';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      color: editForm.color,
    };
    
    onCategoriesChange([...categories, newCategory]);
    setIsAdding(false);
    setEditForm({ name: '', description: '', color: defaultColors[0] });
    setErrors({});
  };

  const handleEdit = (category: Category) => {
    setIsEditing(category.id);
    setEditForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
    });
    setErrors({});
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    const updatedCategories = categories.map(cat =>
      cat.id === isEditing
        ? {
            ...cat,
            name: editForm.name.trim(),
            description: editForm.description.trim(),
            color: editForm.color,
          }
        : cat
    );
    
    onCategoriesChange(updatedCategories);
    setIsEditing(null);
    setEditForm({ name: '', description: '', color: defaultColors[0] });
    setErrors({});
  };

  const handleDelete = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category?.isDefault) {
      alert('No se puede eliminar una categoría por defecto');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      onCategoriesChange(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    setEditForm({ name: '', description: '', color: defaultColors[0] });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Gestión de Categorías
        </h3>
        {!isAdding && !isEditing && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Nueva Categoría
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                }`}
                placeholder="Nombre de la categoría"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex space-x-2">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleInputChange('color', color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      editForm.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            {isEditing === category.id ? (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-500'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="flex space-x-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleInputChange('color', color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        editForm.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4 flex-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                    {category.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                        Por defecto
                      </span>
                    )}
                  </h4>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {isEditing === category.id ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:text-green-800 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                    disabled={isEditing !== null || isAdding}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!category.isDefault && (
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      disabled={isEditing !== null || isAdding}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay categorías configuradas. Agrega la primera categoría.
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;