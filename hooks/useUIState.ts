import { useState, useCallback } from 'react';

export type UIState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface UIStateData<T = any> {
  state: UIState;
  data?: T;
  error?: string;
  isEmpty?: boolean;
}

export const useUIState = <T = any>(initialState: UIState = 'idle') => {
  const [uiState, setUIState] = useState<UIStateData<T>>({
    state: initialState,
    data: undefined,
    error: undefined,
    isEmpty: false,
  });

  const setLoading = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      state: 'loading',
      error: undefined,
    }));
  }, []);

  const setSuccess = useCallback((data?: T) => {
    const isEmpty = !data || (Array.isArray(data) && data.length === 0);
    setUIState({
      state: isEmpty ? 'empty' : 'success',
      data,
      error: undefined,
      isEmpty,
    });
  }, []);

  const setError = useCallback((error: string) => {
    setUIState(prev => ({
      ...prev,
      state: 'error',
      error,
    }));
  }, []);

  const setEmpty = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      state: 'empty',
      data: undefined,
      isEmpty: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setUIState({
      state: 'idle',
      data: undefined,
      error: undefined,
      isEmpty: false,
    });
  }, []);

  // Helpers para verificar estados
  const isLoading = uiState.state === 'loading';
  const isError = uiState.state === 'error';
  const isEmpty = uiState.state === 'empty';
  const isSuccess = uiState.state === 'success';
  const hasData = uiState.data !== undefined && !isEmpty;

  return {
    ...uiState,
    setLoading,
    setSuccess,
    setError,
    setEmpty,
    reset,
    isLoading,
    isError,
    isEmpty,
    isSuccess,
    hasData,
  };
};

// Hook específico para operaciones async con manejo automático de estados
export const useAsyncOperation = <T = any>() => {
  const uiState = useUIState<T>();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: string) => void;
      showToast?: boolean;
    }
  ) => {
    try {
      uiState.setLoading();
      const result = await operation();
      uiState.setSuccess(result);
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Ocurrió un error inesperado';
      uiState.setError(errorMessage);
      
      if (options?.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  }, [uiState]);

  return {
    ...uiState,
    execute,
  };
};