import { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield, Swords, Crown } from 'lucide-react';
import Button from './Button';

export type ErrorType = 'connection' | 'validation' | 'server' | 'game' | 'auth' | 'network' | 'generic';

interface ErrorDisplayProps {
  error: string | null;
  type?: ErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  onHome?: () => void;
  showActions?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  customActions?: ReactNode;
}

export default function ErrorDisplay({
  error,
  type = 'generic',
  onRetry,
  onDismiss,
  onHome,
  showActions = true,
  size = 'medium',
  className = '',
  customActions
}: ErrorDisplayProps) {
  if (!error) return null;

  const getErrorIcon = (iconSize: number) => {
    switch (type) {
      case 'connection':
        return <Shield size={iconSize} className="text-red-400" />;
      case 'validation':
        return <AlertTriangle size={iconSize} className="text-orange-400" />;
      case 'server':
        return <Swords size={iconSize} className="text-red-400" />;
      case 'game':
        return <Crown size={iconSize} className="text-red-400" />;
      case 'auth':
        return <Shield size={iconSize} className="text-red-400" />;
      case 'network':
        return <RefreshCw size={iconSize} className="text-red-400" />;
      default:
        return <AlertTriangle size={iconSize} className="text-red-400" />;
    }
  };


  const getErrorTitle = () => {
    switch (type) {
      case 'connection':
        return 'Connection Lost';
      case 'validation':
        return 'Invalid Input';
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
  };

  const getErrorSuggestion = () => {
    switch (type) {
      case 'connection':
        return 'Please check your internet connection and try again.';
      case 'validation':
        return 'Please check your input and try again.';
      case 'server':
        return 'The server is experiencing issues. Please try again in a moment.';
      case 'game':
        return 'There was an issue with the game. Please try again.';
      case 'auth':
        return 'Authentication failed. Please try again.';
      case 'network':
        return 'Network connection is unstable. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'connection':
        return 'border-red-500';
      case 'validation':
        return 'border-orange-500';
      case 'server':
        return 'border-red-600';
      case 'game':
        return 'border-red-500';
      case 'auth':
        return 'border-red-500';
      case 'network':
        return 'border-blue-500';
      default:
        return 'border-red-500';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'connection':
        return 'bg-red-900 bg-opacity-20';
      case 'validation':
        return 'bg-orange-900 bg-opacity-20';
      case 'server':
        return 'bg-red-900 bg-opacity-25';
      case 'game':
        return 'bg-red-900 bg-opacity-20';
      case 'auth':
        return 'bg-red-900 bg-opacity-20';
      case 'network':
        return 'bg-blue-900 bg-opacity-20';
      default:
        return 'bg-red-900 bg-opacity-20';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-3',
          title: 'text-sm',
          message: 'text-xs',
          iconSize: 20
        };
      case 'medium':
        return {
          container: 'p-4',
          title: 'text-base',
          message: 'text-sm',
          iconSize: 28
        };
      case 'large':
        return {
          container: 'p-6',
          title: 'text-lg',
          message: 'text-base',
          iconSize: 36
        };
      default:
        return {
          container: 'p-4',
          title: 'text-base',
          message: 'text-sm',
          iconSize: 28
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div 
      className={`
        ${sizeClasses.container} 
        ${getBackgroundColor()} 
        ${getBorderColor()} 
        border-2 rounded-lg 
        animate-in fade-in slide-in-from-top-2 duration-300
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="p-2 rounded-lg bg-black bg-opacity-30 mb-1">
            {getErrorIcon(sizeClasses.iconSize)}
          </div>
        </div>
        
        {/* Error content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`${sizeClasses.title} font-bold text-red-100 font-display`}>
              {getErrorTitle()}
            </h3>
          </div>
          
          <p className={`${sizeClasses.message} text-red-200 font-medium mb-2`}>
            {error}
          </p>
          
          <p className={`${sizeClasses.message} text-red-300 text-opacity-80 text-xs`}>
            {getErrorSuggestion()}
          </p>
        </div>
        
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-300 hover:text-red-100 transition-colors text-lg font-bold"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Action buttons */}
      {showActions && (onRetry || onHome || customActions) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onRetry && (
            <Button
              variant="medieval-red"
              size="small"
              onClick={onRetry}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Retry
            </Button>
          )}
          
          {onHome && (
            <Button
              variant="medieval-stone"
              size="small"
              onClick={onHome}
              className="flex items-center gap-1"
            >
              <Home size={14} />
              Home
            </Button>
          )}
          
          {customActions}
        </div>
      )}
      
      {/* Medieval border accent */}
      <div className="absolute inset-0 rounded-lg border border-medieval-metal-copper opacity-20 pointer-events-none" />
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600/10 via-transparent to-red-600/10 pointer-events-none" />
      
      {/* Ambient particles for urgent errors */}
      {(type === 'server' || type === 'connection') && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-60" />
          <div className="absolute bottom-2 left-2 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '0.5s' }} />
        </div>
      )}
    </div>
  );
}