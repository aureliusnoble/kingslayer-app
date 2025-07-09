import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export default function Toast({ 
  id, 
  type, 
  message, 
  description, 
  duration = 4000, 
  onClose, 
  position = 'top-right' 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={16} />;
      case 'error':
        return <X size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'info':
        return <Info size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getThemeClasses = () => {
    const baseClasses = 'border-2 shadow-medieval';
    
    switch (type) {
      case 'success':
        return clsx(
          baseClasses,
          'bg-green-900 bg-opacity-90 text-green-100 border-green-600',
          'shadow-lg shadow-green-900/50'
        );
      case 'error':
        return clsx(
          baseClasses,
          'bg-red-900 bg-opacity-90 text-red-100 border-red-600',
          'shadow-lg shadow-red-900/50'
        );
      case 'warning':
        return clsx(
          baseClasses,
          'bg-orange-900 bg-opacity-90 text-orange-100 border-orange-600',
          'shadow-lg shadow-orange-900/50'
        );
      case 'info':
        return clsx(
          baseClasses,
          'bg-blue-900 bg-opacity-90 text-blue-100 border-blue-600',
          'shadow-lg shadow-blue-900/50'
        );
      default:
        return clsx(
          baseClasses,
          'bg-medieval-stone-medium text-medieval-parchment border-medieval-stone-light'
        );
    }
  };

  const getProgressBarColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-orange-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-medieval-metal-gold';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimationClasses = () => {
    if (isExiting) {
      return 'animate-out fade-out slide-out-to-right-full duration-300';
    }
    if (isVisible) {
      return 'animate-in fade-in slide-in-from-right-full duration-300';
    }
    return 'opacity-0 translate-x-full';
  };

  return (
    <div
      className={clsx(
        'fixed z-50 max-w-sm w-full pointer-events-auto',
        getPositionClasses(),
        getAnimationClasses()
      )}
    >
      <div
        className={clsx(
          'relative rounded-lg p-4 backdrop-blur-md',
          getThemeClasses()
        )}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black bg-opacity-30 rounded-t-lg overflow-hidden">
          <div 
            className={clsx(
              'h-full transition-all ease-linear',
              getProgressBarColor()
            )}
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>

        {/* Content */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-display">
              {message}
            </p>
            {description && (
              <p className="mt-1 text-xs opacity-90">
                {description}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-lg opacity-70 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>

        {/* Medieval border accent */}
        <div className="absolute inset-0 rounded-lg border border-medieval-metal-gold opacity-20 pointer-events-none" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-medieval-metal-gold/10 via-transparent to-medieval-metal-copper/10 pointer-events-none" />
      </div>
    </div>
  );
}

// Toast notification component with medieval theming and smooth animations