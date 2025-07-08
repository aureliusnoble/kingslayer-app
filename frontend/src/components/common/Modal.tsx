import { ReactNode } from 'react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  theme?: 'default' | 'medieval' | 'parchment' | 'stone' | 'royal';
  size?: 'small' | 'medium' | 'large';
  blocking?: boolean; // For critical notifications that shouldn't be dismissed
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className,
  theme = 'default',
  size = 'medium',
  blocking = false
}: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (!blocking && onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className={clsx(
          'absolute inset-0 bg-black transition-opacity duration-200',
          theme === 'royal' ? 'bg-opacity-70' : 'bg-opacity-50'
        )}
        onClick={handleBackdropClick}
      />
      <div className={clsx(
        'relative rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden',
        'animate-in zoom-in-95 slide-in-from-bottom-2 duration-200',
        
        // Size variants
        {
          'max-w-sm': size === 'small',
          'max-w-md': size === 'medium',
          'max-w-lg': size === 'large',
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
      }}>
        {title && (
          <div className={clsx(
            'px-6 py-4 border-b',
            {
              'border-neutral-light': theme === 'default',
              'border-medieval-stone-light border-opacity-30': theme === 'medieval',
              'border-medieval-metal-copper border-opacity-40': theme === 'parchment',
              'border-medieval-stone-dark border-opacity-50': theme === 'stone',
              'border-medieval-metal-gold border-opacity-40': theme === 'royal',
            }
          )}>
            <h2 className={clsx(
              'text-xl font-semibold',
              theme === 'royal' && 'font-display text-medieval-metal-gold'
            )}>
              {title}
            </h2>
          </div>
        )}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}