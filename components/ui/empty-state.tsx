import React from 'react';
import { Search, Calendar, Users, Award, Plus, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'search' | 'calendar' | 'users' | 'award' | 'plus' | 'refresh';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const icons = {
  search: Search,
  calendar: Calendar,
  users: Users,
  award: Award,
  plus: Plus,
  refresh: RefreshCw,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search',
  title = 'Sin datos por ahora',
  message = 'No hay información disponible en este momento.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}) => {
  const Icon = icons[icon];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-sm mx-auto">{message}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex justify-center space-x-3">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Estados específicos predefinidos
export const EmptyPodium: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    icon="award"
    title="Podio no disponible"
    message="Los resultados del podio se mostrarán una vez que finalice el congreso."
    actionLabel={onRefresh ? "Actualizar" : undefined}
    onAction={onRefresh}
  />
);

export const EmptyActivities: React.FC<{ onCreateActivity?: () => void; onRefresh?: () => void }> = ({ 
  onCreateActivity, 
  onRefresh 
}) => (
  <EmptyState
    icon="calendar"
    title="No hay actividades"
    message="No se han encontrado actividades disponibles en este momento."
    actionLabel={onCreateActivity ? "Crear actividad" : undefined}
    onAction={onCreateActivity}
    secondaryActionLabel={onRefresh ? "Actualizar" : undefined}
    onSecondaryAction={onRefresh}
  />
);

export const EmptyEnrollments: React.FC<{ onBrowseActivities?: () => void }> = ({ onBrowseActivities }) => (
  <EmptyState
    icon="users"
    title="Sin inscripciones"
    message="Aún no te has inscrito a ninguna actividad. ¡Explora las actividades disponibles!"
    actionLabel={onBrowseActivities ? "Ver actividades" : undefined}
    onAction={onBrowseActivities}
  />
);

export const EmptySearch: React.FC<{ onClearSearch?: () => void }> = ({ onClearSearch }) => (
  <EmptyState
    icon="search"
    title="Sin resultados"
    message="No se encontraron resultados para tu búsqueda. Intenta con otros términos."
    actionLabel={onClearSearch ? "Limpiar búsqueda" : undefined}
    onAction={onClearSearch}
  />
);