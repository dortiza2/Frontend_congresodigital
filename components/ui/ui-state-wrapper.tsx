import React from 'react';
import { ErrorState } from './error-state';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import { UIStateData } from '../../hooks/useUIState';

interface UIStateWrapperProps {
  uiState: UIStateData;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
  onGoHome?: () => void;
  emptyProps?: {
    icon?: 'search' | 'calendar' | 'users' | 'award' | 'plus' | 'refresh';
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
  };
  errorProps?: {
    title?: string;
    message?: string;
    showRetry?: boolean;
    showGoHome?: boolean;
  };
  children: React.ReactNode;
  className?: string;
}

export const UIStateWrapper: React.FC<UIStateWrapperProps> = ({
  uiState,
  loadingComponent,
  emptyComponent,
  errorComponent,
  onRetry,
  onGoHome,
  emptyProps,
  errorProps,
  children,
  className = ''
}) => {
  // Estado de carga
  if (uiState.state === 'loading') {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }
    return (
      <div className={className}>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Estado de error
  if (uiState.state === 'error') {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>;
    }
    return (
      <div className={className}>
        <ErrorState
          title={errorProps?.title}
          message={uiState.error || errorProps?.message}
          onRetry={onRetry}
          onGoHome={onGoHome}
          showRetry={errorProps?.showRetry ?? true}
          showGoHome={errorProps?.showGoHome ?? false}
        />
      </div>
    );
  }

  // Estado vacío
  if (uiState.state === 'empty') {
    if (emptyComponent) {
      return <div className={className}>{emptyComponent}</div>;
    }
    return (
      <div className={className}>
        <EmptyState
          icon={emptyProps?.icon}
          title={emptyProps?.title}
          message={emptyProps?.message}
          actionLabel={emptyProps?.actionLabel}
          onAction={emptyProps?.onAction}
          secondaryActionLabel={emptyProps?.secondaryActionLabel}
          onSecondaryAction={emptyProps?.onSecondaryAction}
        />
      </div>
    );
  }

  // Estado exitoso - mostrar contenido
  return <div className={className}>{children}</div>;
};

// Componentes específicos para casos comunes
export const ActivitiesStateWrapper: React.FC<{
  uiState: UIStateData;
  onRetry?: () => void;
  onCreateActivity?: () => void;
  children: React.ReactNode;
}> = ({ uiState, onRetry, onCreateActivity, children }) => (
  <UIStateWrapper
    uiState={uiState}
    loadingComponent={
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    }
    onRetry={onRetry}
    emptyProps={{
      icon: 'calendar',
      title: 'No hay actividades',
      message: 'No se han encontrado actividades disponibles en este momento.',
      actionLabel: onCreateActivity ? 'Crear actividad' : undefined,
      onAction: onCreateActivity,
      secondaryActionLabel: onRetry ? 'Actualizar' : undefined,
      onSecondaryAction: onRetry,
    }}
  >
    {children}
  </UIStateWrapper>
);

export const EnrollmentsStateWrapper: React.FC<{
  uiState: UIStateData;
  onRetry?: () => void;
  onBrowseActivities?: () => void;
  children: React.ReactNode;
}> = ({ uiState, onRetry, onBrowseActivities, children }) => (
  <UIStateWrapper
    uiState={uiState}
    loadingComponent={
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    }
    onRetry={onRetry}
    emptyProps={{
      icon: 'users',
      title: 'Sin inscripciones',
      message: 'Aún no te has inscrito a ninguna actividad. ¡Explora las actividades disponibles!',
      actionLabel: onBrowseActivities ? 'Ver actividades' : undefined,
      onAction: onBrowseActivities,
      secondaryActionLabel: onRetry ? 'Actualizar' : undefined,
      onSecondaryAction: onRetry,
    }}
  >
    {children}
  </UIStateWrapper>
);

export const PodiumStateWrapper: React.FC<{
  uiState: UIStateData;
  onRetry?: () => void;
  children: React.ReactNode;
}> = ({ uiState, onRetry, children }) => (
  <UIStateWrapper
    uiState={uiState}
    loadingComponent={
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
            <Skeleton className="h-4 w-24 mx-auto mb-2" />
            <Skeleton className="h-3 w-16 mx-auto mb-2" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
        ))}
      </div>
    }
    onRetry={onRetry}
    emptyProps={{
      icon: 'award',
      title: 'Podio no disponible',
      message: 'Los resultados del podio se mostrarán una vez que finalice el congreso.',
      actionLabel: onRetry ? 'Actualizar' : undefined,
      onAction: onRetry,
    }}
  >
    {children}
  </UIStateWrapper>
);