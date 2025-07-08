import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'red' | 'blue' | 'medieval-red' | 'medieval-blue' | 'medieval-gold' | 'medieval-stone';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  medieval?: boolean; // Enables medieval styling for legacy variants
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  medieval = false,
  disabled,
  ...props
}: ButtonProps) {
  const isMedievalVariant = variant.startsWith('medieval-') || medieval;
  
  return (
    <button
      className={clsx(
        // Base classes
        'font-semibold rounded-lg transition-all duration-200 transform',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Animation classes
        isMedievalVariant ? 'active:animate-button-press' : 'active:scale-[0.98]',
        
        // Variant classes
        {
          // Legacy variants
          'btn-primary': variant === 'primary' && !medieval,
          'btn-secondary': variant === 'secondary' && !medieval,
          'btn-primary btn-red': variant === 'red' && !medieval,
          'btn-primary btn-blue': variant === 'blue' && !medieval,
          
          // Medieval variants
          'btn-medieval-red': variant === 'medieval-red' || ((variant === 'primary' || variant === 'red') && medieval),
          'btn-medieval-blue': variant === 'medieval-blue' || ((variant === 'secondary' || variant === 'blue') && medieval),
          'btn-medieval-gold': variant === 'medieval-gold',
          'btn-medieval-stone': variant === 'medieval-stone',
          
          // Size classes
          'px-4 py-2 text-sm': size === 'small',
          'px-6 py-3': size === 'medium',
          'px-8 py-4 text-lg': size === 'large',
          
          // Width
          'w-full': fullWidth,
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}