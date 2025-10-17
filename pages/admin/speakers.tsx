import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Globe, 
  Image,
  FileText,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole } from '@/lib/roleUtils';
import { 
  Speaker, 
  CreateSpeakerRequest, 
  UpdateSpeakerRequest,
  SpeakerService, 
  SpeakerValidation 
} from '@/services/speakers';

// Modal para crear/editar speaker
const CreateSpeakerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSpeakerRequest) => Promise<void>;
  speaker?: Speaker | null;
}> = ({ isOpen, onClose, onSubmit, speaker }) => {
  const [formData, setFormData] = useState<CreateSpeakerRequest>({
    fullName: '',
    title: '',
    bio: '',
    avatarUrl: '',
    links: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (speaker) {
      setFormData({
        fullName: speaker.fullName,
        title: speaker.title || '',
        bio: speaker.bio || '',
        avatarUrl: speaker.avatarUrl || '',
        links: speaker.links || ''
      });
    } else {
      setFormData({
        fullName: '',
        title: '',
        bio: '',
        avatarUrl: '',
        links: ''
      });
    }
    setErrors({});
  }, [speaker, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const fullNameError = SpeakerValidation.validateFullName(formData.fullName);
    if (fullNameError) newErrors.fullName = fullNameError;

    const titleError = SpeakerValidation.validateTitle(formData.title);
    if (titleError) newErrors.title = titleError;

    const bioError = SpeakerValidation.validateBio(formData.bio);
    if (bioError) newErrors.bio = bioError;

    const avatarError = SpeakerValidation.validateAvatarUrl(formData.avatarUrl);
    if (avatarError) newErrors.avatarUrl = avatarError;

    const linksError = SpeakerValidation.validateLinks(formData.links);
    if (linksError) newErrors.links = linksError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {speaker ? 'Editar Speaker' : 'Crear Nuevo Speaker'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Dr. Juan Pérez"
                required
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título/Cargo
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Director de Innovación, Universidad XYZ"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Biografía */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biografía
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Breve descripción del speaker..."
                rows={4}
              />
            </div>
            {errors.bio && (
              <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
            )}
          </div>

          {/* URL del Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Avatar
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.avatarUrl ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://ejemplo.com/avatar.jpg"
              />
            </div>
            {errors.avatarUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.avatarUrl}</p>
            )}
          </div>

          {/* Enlaces sociales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enlaces Sociales (JSON)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={formData.links}
                onChange={(e) => setFormData(prev => ({ ...prev, links: e.target.value }))}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.links ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='{"linkedin": "https://linkedin.com/in/usuario", "twitter": "https://twitter.com/usuario"}'
                rows={3}
              />
            </div>
            {errors.links && (
              <p className="text-red-500 text-sm mt-1">{errors.links}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Formato JSON con enlaces a redes sociales
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (speaker ? 'Actualizar' : 'Crear Speaker')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Página principal de speakers
const SpeakersPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar permisos
  if (!user || !hasRole(user.roles || [], 'ADMIN')) {
    return (
      <AdminLayout title="Acceso Denegado">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      const speakersData = await SpeakerService.getSpeakers();
      setSpeakers(speakersData);
    } catch (error) {
      console.error('Error al cargar speakers:', error);
      setNotification('Error al cargar speakers');
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (speaker.title && speaker.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Manejar creación de speaker
  const handleCreateSpeaker = async (speakerData: CreateSpeakerRequest) => {
    try {
      const newSpeaker = await SpeakerService.createSpeaker(speakerData);
      setSpeakers(prev => [...prev, newSpeaker]);
      setNotification(`Speaker ${speakerData.fullName} creado exitosamente`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear speaker';
      setNotification(errorMessage);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Manejar edición de speaker
  const handleUpdateSpeaker = async (speakerData: CreateSpeakerRequest) => {
    if (!editingSpeaker) return;

    try {
      const updatedSpeaker = await SpeakerService.updateSpeaker(editingSpeaker.id, speakerData);
      setSpeakers(prev => prev.map(speaker => 
        speaker.id === editingSpeaker.id ? updatedSpeaker : speaker
      ));
      setEditingSpeaker(null);
      setNotification(`Speaker ${speakerData.fullName} actualizado exitosamente`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar speaker';
      setNotification(errorMessage);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Manejar eliminación de speaker
  const handleDeleteSpeaker = async (speakerId: string, speakerName: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar al speaker ${speakerName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await SpeakerService.deleteSpeaker(speakerId);
      setSpeakers(prev => prev.filter(speaker => speaker.id !== speakerId));
      setNotification(`Speaker ${speakerName} eliminado exitosamente`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar speaker';
      setNotification(errorMessage);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const formatLinks = (links?: string) => {
    if (!links) return null;
    try {
      const parsed = JSON.parse(links);
      return Object.entries(parsed).map(([platform, url]) => (
        <a
          key={platform}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          {platform}
        </a>
      ));
    } catch {
      return <span className="text-gray-500 text-xs">Enlaces inválidos</span>;
    }
  };

  return (
    <AdminLayout title="Gestión de Speakers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Speakers</h1>
            <p className="text-gray-600">Administra los speakers del congreso</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Speaker</span>
          </button>
        </div>

        {/* Notificación */}
        {notification && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{notification}</span>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar speakers por nombre o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tabla de speakers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Speaker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Biografía
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enlaces
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Cargando speakers...
                    </td>
                  </tr>
                ) : filteredSpeakers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron speakers que coincidan con la búsqueda' : 'No hay speakers registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredSpeakers.map((speaker) => (
                    <tr key={speaker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {speaker.avatarUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={speaker.avatarUrl}
                              alt={speaker.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {speaker.fullName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {speaker.title || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {speaker.bio || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {formatLinks(speaker.links) || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingSpeaker(speaker)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar speaker"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSpeaker(speaker.id, speaker.fullName)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar speaker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Información importante:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Solo usuarios ADMIN pueden gestionar speakers</li>
            <li>• Los speakers aparecerán automáticamente en la página pública</li>
            <li>• Las imágenes de avatar deben ser URLs públicas válidas</li>
            <li>• Los enlaces sociales deben estar en formato JSON válido</li>
            <li>• La biografía se mostrará en la página de detalle del speaker</li>
          </ul>
        </div>

        {/* Modales */}
        <CreateSpeakerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSpeaker}
        />

        <CreateSpeakerModal
          isOpen={!!editingSpeaker}
          onClose={() => setEditingSpeaker(null)}
          onSubmit={handleUpdateSpeaker}
          speaker={editingSpeaker}
        />
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Redirect unauthenticated users to login
  if (!session?.user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  // Check admin role level (roleLevel >= 3 for admin access)
  const roleLevel = session.user.roleLevel || 0;
  if (roleLevel < 3) {
    // Redirect staff to dashboard
    if (roleLevel >= 2) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      };
    }
    
    // Redirect authenticated students to mi-cuenta
    if (roleLevel >= 1) {
      return {
        redirect: {
          destination: '/mi-cuenta',
          permanent: false,
        },
      };
    }

    // Redirect users without sufficient role level to login
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default SpeakersPage;