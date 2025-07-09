import { useState, useCallback } from 'react';
import { useToast } from '../components/common/ToastProvider';
import { ErrorType } from '../components/common/ErrorDisplay';

export interface ErrorInfo {
  message: string;
  type: ErrorType;
  timestamp: number;
  context?: string;
}

interface UseErrorHandlerReturn {
  error: ErrorInfo | null;
  setError: (error: string | null, type?: ErrorType, context?: string) => void;
  clearError: () => void;
  showErrorToast: (message: string, type?: ErrorType) => void;
  handleAsyncError: <T>(
    asyncOperation: () => Promise<T>,
    errorType?: ErrorType,
    context?: string
  ) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<ErrorInfo | null>(null);
  const { showError } = useToast();

  const setError = useCallback((message: string | null, type: ErrorType = 'generic', context?: string) => {
    if (message) {
      setErrorState({
        message,
        type,
        timestamp: Date.now(),
        context
      });
    } else {
      setErrorState(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const showErrorToast = useCallback((message: string, type: ErrorType = 'generic') => {
    const toastMessage = getErrorTypeMessage(type);
    showError(toastMessage, message);
  }, [showError]);

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    errorType: ErrorType = 'generic',
    context?: string
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await asyncOperation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage, errorType, context);
      return null;
    }
  }, [setError, clearError]);

  return {
    error,
    setError,
    clearError,
    showErrorToast,
    handleAsyncError
  };
}

function getErrorTypeMessage(type: ErrorType): string {
  switch (type) {
    case 'connection':
      return 'Connection Issue';
    case 'validation':
      return 'Input Error';
    case 'server':
      return 'Server Error';
    case 'game':
      return 'Game Error';
    case 'auth':
      return 'Authentication Error';
    case 'network':
      return 'Network Error';
    default:
      return 'Error';
  }
}

// Helper function to determine error type from error message
export function getErrorTypeFromMessage(message: string): ErrorType {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('connection') || lowerMessage.includes('connect')) {
    return 'connection';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('offline')) {
    return 'network';
  }
  if (lowerMessage.includes('server') || lowerMessage.includes('internal')) {
    return 'server';
  }
  if (lowerMessage.includes('invalid') || lowerMessage.includes('required')) {
    return 'validation';
  }
  if (lowerMessage.includes('auth') || lowerMessage.includes('permission')) {
    return 'auth';
  }
  if (lowerMessage.includes('game') || lowerMessage.includes('room') || lowerMessage.includes('player')) {
    return 'game';
  }
  
  return 'generic';
}