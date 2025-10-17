import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/portal/PortalLayout';
import { User, Edit, Save, X, Shield, Building2, GraduationCap } from 'lucide-react';
import { getUserProfile, updateUserProfile, type UserProfileResponse } from '@/services/profile';
import { getProfileDescription, PROFILE_TYPES, STAFF_ROLES } from '@/lib/roleUtils';

const PerfilPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      
      // Solo permitir actualizar fullName para usuarios
      const updateData = {
        fullName: profile.fullName
      };
      
      const updatedProfile = await updateUserProfile(updateData);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); // Recargar datos originales
  };

  const updateProfile = (field: keyof UserProfileResponse, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const getProfileIcon = () => {
    if (!profile) return <User className="h-8 w-8 text-blue-600" />;
    
    if (profile.profileType === PROFILE_TYPES.STAFF) {
      return <Shield className="h-8 w-8 text-purple-600" />;
    }
    
    return profile.isUmg ? 
      <GraduationCap className="h-8 w-8 text-green-600" /> : 
      <Building2 className="h-8 w-8 text-blue-600" />;
  };

  const getProfileTypeLabel = () => {
    if (!profile) return 'Usuario';
    return getProfileDescription(profile);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </PortalLayout>
    );
  }

  if (!profile) {
    return (
      <PortalLayout>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          No se pudo cargar la información del perfil.
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                {getProfileIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-gray-600">Gestiona tu información personal</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Información del perfil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Personal</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => updateProfile('fullName', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Tu nombre completo"
              />
            </div>

            {/* Email (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={profile.email}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                placeholder="correo@ejemplo.com"
              />
              <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede modificar</p>
            </div>

            {/* Tipo de perfil (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Perfil
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={getProfileTypeLabel()}
                  disabled={true}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                {profile.profileType === PROFILE_TYPES.STAFF && profile.staffRole && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile.staffRole === STAFF_ROLES.ADMIN_DEV ? 'bg-red-100 text-red-800' :
                    profile.staffRole === STAFF_ROLES.ADMIN ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {profile.staffRole}
                  </span>
                )}
              </div>
            </div>

            {/* Organización (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organización
              </label>
              <input
                type="text"
                value={profile.isUmg ? 'Universidad Mariano Gálvez' : (profile.orgName || 'No especificada')}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-4">Información del Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Usuario
                </label>
                <input
                  type="text"
                  value={profile.id}
                  disabled={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Registro
                </label>
                <input
                  type="text"
                  value={new Date(profile.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  disabled={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default PerfilPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Redirect unauthenticated users to login
  if (!session?.user) {
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }

  // Check portal access (roleLevel >= 1)
  const roleLevel = session.user.roleLevel || 0;
  if (roleLevel < 1) {
    return {
      redirect: {
        destination: '/inscripcion',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};