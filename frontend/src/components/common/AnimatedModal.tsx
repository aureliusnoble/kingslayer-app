import { ReactNode, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  theme?: 'default' | 'medieval' | 'parchment' | 'stone' | 'royal';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  blocking?: boolean;
  animation?: 'fade' | 'slide' | 'scale' | 'medieval' | 'flip';
  position?: 'center' | 'top' | 'bottom';
  showOverlay?: boolean;
  overlayBlur?: boolean;
  onAnimationComplete?: () => void;
}

export default function AnimatedModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  theme = 'medieval',
  size = 'medium',
  blocking = false,
  animation = 'medieval',
  position = 'center',
  showOverlay = true,
  overlayBlur = true,
  onAnimationComplete
}: AnimatedModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocus.current = document.activeElement as HTMLElement;
      
      setShouldRender(true);
      
      // Trigger enter animation
      const timer = setTimeout(() => {
        setIsVisible(true);
        onAnimationComplete?.();
      }, 50);
      
      return () => clearTimeout(timer);
    } else if (shouldRender) {
      // Trigger exit animation
      setIsVisible(false);
      
      const timer = setTimeout(() => {
        setShouldRender(false);
        onAnimationComplete?.();
        
        // Restore focus to previously focused element
        if (previousFocus.current) {
          previousFocus.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, onAnimationComplete]);

  // Focus management
  useEffect(() => {
    if (isVisible && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isVisible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !blocking && onClose) {
      onClose();
    }
    
    // Tab trapping
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !blocking && onClose) {
      onClose();
    }
  };

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    switch (animation) {
      case 'fade':
        return isVisible
          ? `${baseClasses} opacity-100`
          : `${baseClasses} opacity-0`;
      
      case 'slide':
        return isVisible
          ? `${baseClasses} opacity-100 transform translate-y-0`
          : `${baseClasses} opacity-0 transform translate-y-8`;
      
      case 'scale':
        return isVisible
          ? `${baseClasses} opacity-100 transform scale-100`
          : `${baseClasses} opacity-0 transform scale-95`;
      
      case 'medieval':
        return isVisible
          ? `${baseClasses} opacity-100 transform scale-100 rotate-0`
          : `${baseClasses} opacity-0 transform scale-95 rotate-1`;
      
      case 'flip':
        return isVisible
          ? `${baseClasses} opacity-100 transform rotateY-0`
          : `${baseClasses} opacity-0 transform rotateY-90`;
      
      default:
        return isVisible
          ? `${baseClasses} opacity-100`
          : `${baseClasses} opacity-0`;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'items-start pt-16';
      case 'bottom':
        return 'items-end pb-16';
      case 'center':
      default:
        return 'items-center';
    }
  };

  const getOverlayClasses = () => {
    const blurClasses = overlayBlur ? 'backdrop-blur-sm' : '';
    const baseClasses = `fixed inset-0 transition-opacity duration-300 ${blurClasses}`;
    
    switch (theme) {
      case 'medieval':
        return `${baseClasses} bg-black ${isVisible ? 'bg-opacity-60' : 'bg-opacity-0'}`;
      case 'royal':
        return `${baseClasses} bg-black ${isVisible ? 'bg-opacity-70' : 'bg-opacity-0'}`;
      default:
        return `${baseClasses} bg-black ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0'}`;
    }
  };

  if (!shouldRender) return null;

  const modalContent = (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex p-4',
        getPositionClasses()
      )}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      {showOverlay && (
        <div
          className={getOverlayClasses()}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Modal */}
      <div
        ref={modalRef}
        className={clsx(
          'relative rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden z-10',
          getAnimationClasses(),
          
          // Size variants
          {
            'max-w-sm': size === 'small',
            'max-w-md': size === 'medium',
            'max-w-lg': size === 'large',
            'max-w-none m-0 h-screen rounded-none': size === 'fullscreen',
          },
          
          // Theme variants
          {
            // Default theme
            'bg-white text-neutral-dark': theme === 'default',
            
            // Medieval theme
            'bg-surface-medium text-white border-2 border-medieval-stone-light': theme === 'medieval',
            
            // Parchment theme
            'text-medieval-stone-dark border-2 border-medieval-metal-copper': theme === 'parchment',
            
            // Stone theme
            'bg-medieval-stone-medium text-white border-2 border-medieval-stone-light': theme === 'stone',
            
            // Royal theme
            'bg-surface-dark text-white border-2 border-medieval-metal-gold': theme === 'royal',
          },
          className
        )}
        style={{
          background: theme === 'parchment' 
            ? 'linear-gradient(135deg, #FEF3C7, #fef7cd)' 
            : undefined
        }}
      >
        {/* Header */}
        {title && (
          <div className={clsx(
            'px-6 py-4 border-b flex items-center justify-between',
            {
              'border-neutral-light': theme === 'default',
              'border-medieval-stone-light border-opacity-30': theme === 'medieval',
              'border-medieval-metal-copper border-opacity-40': theme === 'parchment',
              'border-medieval-stone-dark border-opacity-50': theme === 'stone',
              'border-medieval-metal-gold border-opacity-40': theme === 'royal',
            }
          )}>
            <h2 
              id="modal-title"
              className={clsx(
                'text-xl font-semibold',
                theme === 'royal' && 'font-display text-medieval-metal-gold'
              )}
            >
              {title}
            </h2>
            
            {/* Close button */}
            {!blocking && onClose && (
              <button
                onClick={onClose}
                className={clsx(
                  'ml-4 text-2xl font-bold transition-colors',
                  theme === 'royal' 
                    ? 'text-medieval-metal-gold hover:text-medieval-flame-yellow'
                    : 'text-current hover:text-red-400'
                )}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>

        {/* Medieval border accent */}
        {theme === 'medieval' && (
          <div className="absolute inset-0 rounded-lg border border-medieval-metal-gold opacity-20 pointer-events-none" />
        )}
        
        {/* Ambient effects for medieval theme */}
        {theme === 'medieval' && isVisible && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 w-1 h-1 bg-medieval-flame-yellow rounded-full animate-pulse opacity-40" />
            <div className="absolute bottom-4 left-4 w-1 h-1 bg-medieval-flame-orange rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }} />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}