import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import AdminLayout from '../../components/admin/AdminLayout';

import { 
  Activity, 
  CreateActivityRequest, 
  UpdateActivityRequest,
  useActivityService,
  ActivityValidation 
} from '../../services/activities';

interface ActivityFormData {
  title: string;
  description: string;
  activityType: 'CHARLA' | 'TALLER' | 'COMPETENCIA';
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
  requiresEnrollment: boolean;
}

const initialFormData: ActivityFormData = {
  title: '',
  description: '',
  activityType: 'TALLER',
  location: '',
  startTime: '',
  endTime: '',
  capacity: 30,
  isActive: true,
  requiresEnrollment: true,
};

const activityTypeOptions = [
  { value: 'CHARLA', label: 'Charla', color: 'bg-blue-100 text-blue-800' },
  { value: 'TALLER', label: 'Taller', color: 'bg-green-100 text-green-800' },
  { value: 'COMPETENCIA', label: 'Competencia', color: 'bg-purple-100 text-purple-800' },
];

export default function ActividadesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [formData, setFormData] = useState<ActivityFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { 
    loading, 
    error, 
    getAll, 
    create, 
    update, 
    remove, 
    publish, 
    unpublish,
    clearError 
  } = useActivityService();

  // Cargar actividades al montar el componente
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const res = await getAll();
    const items = res?.data?.items;
    if (items && Array.isArray(items)) {
      setActivities(items as unknown as Activity[]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : type === 'number' ? parseInt(value) || 0 
              : value
    }));

    // Limpiar error de validación para este campo
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar título
    const titleError = ActivityValidation.validateTitle(formData.title);
    if (titleError) errors.title = titleError;

    // Validar descripción
    const descError = ActivityValidation.validateDescription(formData.description);
    if (descError) errors.description = descError;

    // Validar tipo
    const typeError = ActivityValidation.validateActivityType(formData.activityType);
    if (typeError) errors.activityType = typeError;

    // Validar ubicación
    const locationError = ActivityValidation.validateLocation(formData.location);
    if (locationError) errors.location = locationError;

    // Validar capacidad
    const capacityError = ActivityValidation.validateCapacity(formData.capacity);
    if (capacityError) errors.capacity = capacityError;

    // Validar rango de tiempo
    const timeError = ActivityValidation.validateTimeRange(formData.startTime, formData.endTime);
    if (timeError) errors.timeRange = timeError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const requestData: CreateActivityRequest | UpdateActivityRequest = {
      title: formData.title,
      description: formData.description || undefined,
      activityType: formData.activityType,
      location: formData.location || undefined,
      startTime: formData.startTime,
      endTime: formData.endTime,
      capacity: formData.capacity,
      isActive: formData.isActive,
      requiresEnrollment: formData.requiresEnrollment,
    };

    // Los helpers de servicio devuelven datos o null; si hay datos, fue exitoso
    const result = editingId
      ? await update(editingId, requestData)
      : await create(requestData as CreateActivityRequest);

    if (result) {
      await loadActivities();
      resetForm();
    }
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      title: activity.title,
      description: activity.description || '',
      activityType: activity.activityType,
      location: activity.location || '',
      startTime: activity.startTime,
      endTime: activity.endTime,
      capacity: activity.capacity,
      isActive: activity.isActive,
      requiresEnrollment: activity.requiresEnrollment,
    });
    setEditingId(activity.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      const result = await remove(id);
      if (result !== null) {
        await loadActivities();
      }
    }
  };

  const handleTogglePublish = async (activity: Activity) => {
    const result = activity.published 
      ? await unpublish(activity.id)
      : await publish(activity.id);
    
    if (result) {
      await loadActivities();
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setValidationErrors({});
    clearError();
  };

  // Filtrar actividades
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || activity.activityType === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && activity.published) ||
                         (filterStatus === 'unpublished' && !activity.published) ||
                         (filterStatus === 'active' && activity.isActive) ||
                         (filterStatus === 'inactive' && !activity.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: activities.length,
    published: activities.filter(a => a.published).length,
    unpublished: activities.filter(a => !a.published).length,
    charlas: activities.filter(a => a.activityType === 'CHARLA').length,
    talleres: activities.filter(a => a.activityType === 'TALLER').length,
    competencias: activities.filter(a => a.activityType === 'COMPETENCIA').length,
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityTypeStyle = (type: string) => {
    const option = activityTypeOptions.find(opt => opt.value === type);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  return (
      <AdminLayout title="Gestión de Actividades" subtitle="Administra charlas, talleres y competencias">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Actividades</h1>
              <p className="text-gray-600">Administra charlas, talleres y competencias</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Actividad
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              <div className="text-sm text-gray-600">Publicadas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{stats.unpublished}</div>
              <div className="text-sm text-gray-600">Sin publicar</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.charlas}</div>
              <div className="text-sm text-gray-600">Charlas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.talleres}</div>
              <div className="text-sm text-gray-600">Talleres</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.competencias}</div>
              <div className="text-sm text-gray-600">Competencias</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Título, descripción, ubicación..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="CHARLA">Charlas</option>
                  <option value="TALLER">Talleres</option>
                  <option value="COMPETENCIA">Competencias</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="published">Publicadas</option>
                  <option value="unpublished">Sin publicar</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterStatus('all');
                  }}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{typeof error === 'string' ? error : 'Ocurrió un error'}</div>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Lista de actividades */}
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando actividades...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No se encontraron actividades
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actividad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredActivities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {activity.title}
                            </div>
                            {activity.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {activity.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityTypeStyle(activity.activityType)}`}>
                            {activityTypeOptions.find(opt => opt.value === activity.activityType)?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                           <div className="flex items-center gap-1">
                             <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                             </svg>
                             <div>
                               <div>{formatDateTime(activity.startTime)}</div>
                               <div className="text-gray-500">{formatDateTime(activity.endTime)}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-900">
                           {activity.location && (
                             <div className="flex items-center gap-1">
                               <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                               </svg>
                               {activity.location}
                             </div>
                           )}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-900">
                           <div className="flex items-center gap-1">
                             <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                             </svg>
                             {activity.enrolledCount || 0}/{activity.capacity}
                           </div>
                         </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              activity.published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.published ? 'Publicada' : 'Sin publicar'}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              activity.isActive 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(activity)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleTogglePublish(activity)}
                              className={`${
                                activity.published 
                                  ? 'text-yellow-600 hover:text-yellow-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={activity.published ? 'Despublicar' : 'Publicar'}
                            >
                              {activity.published ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de formulario */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingId ? 'Editar Actividad' : 'Nueva Actividad'}
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.title ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Título de la actividad"
                        />
                        {validationErrors.title && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.description ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Descripción de la actividad"
                        />
                        {validationErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo *
                        </label>
                        <select
                          name="activityType"
                          value={formData.activityType}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.activityType ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          {activityTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {validationErrors.activityType && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.activityType}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.location ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Ubicación de la actividad"
                        />
                        {validationErrors.location && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha y hora de inicio *
                        </label>
                        <input
                          type="datetime-local"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.timeRange ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha y hora de fin *
                        </label>
                        <input
                          type="datetime-local"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.timeRange ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.timeRange && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.timeRange}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacidad *
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          min="1"
                          max="1000"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.capacity ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.capacity && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.capacity}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={formData.isActive}
                              onChange={handleInputChange}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Actividad activa</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="requiresEnrollment"
                              checked={formData.requiresEnrollment}
                              onChange={handleInputChange}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Requiere inscripción</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions);
    
    // Verificar si hay sesión
    if (!session || !session.user) {
      return {
        redirect: {
          destination: '/inscripcion',
          permanent: false,
        },
      };
    }

    // Verificar rol de admin (roleLevel >= 3)
    const roleLevel = session.user.roleLevel || 0;
    
    if (roleLevel < 3) {
      return {
        redirect: {
          destination: '/inscripcion',
          permanent: false,
        },
      };
    }

    return {
      props: {
        session,
      },
    };
  } catch (error) {
    console.error('Error in admin/talleres getServerSideProps:', error);
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }
};