import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showEnrollmentSuccess: (activityTitle: string) => void;
  showEmailSuccess: (email: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const showSuccess = (message: string, title: string = 'Éxito') => {
    addToast({ type: 'success', title, message });
  };

  const showError = (message: string, title: string = 'Error') => {
    addToast({ type: 'error', title, message, duration: 7000 });
  };

  const showWarning = (message: string, title: string = 'Advertencia') => {
    addToast({ type: 'warning', title, message });
  };

  const showInfo = (message: string, title: string = 'Información') => {
    addToast({ type: 'info', title, message });
  };

  const showEnrollmentSuccess = (activityTitle: string) => {
    addToast({
      type: 'success',
      title: '¡Inscripción exitosa!',
      message: `Te has inscrito correctamente a "${activityTitle}"`,
      duration: 6000,
    });
  };

  const showEmailSuccess = (email: string) => {
    addToast({
      type: 'success',
      title: 'Email enviado',
      message: `Se ha enviado la confirmación a ${email}`,
      duration: 5000,
    });
  };

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showEnrollmentSuccess,
    showEmailSuccess,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};