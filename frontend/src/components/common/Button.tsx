import { ButtonHTMLAttributes, useRef, useState } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'red' | 'blue' | 'medieval-red' | 'medieval-blue' | 'medieval-gold' | 'medieval-stone';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  medieval?: boolean; // Enables medieval styling for legacy variants
  ripple?: boolean; // Enable ripple effect
  glowOnHover?: boolean; // Enable glow effect on hover
  soundOnClick?: boolean; // Enable sound effect on click (preparation)
  loading?: boolean; // Show loading state
  icon?: 'sword' | 'shield' | 'crown' | 'castle' | 'flame' | 'none';
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  medieval = false,
  ripple = true,
  glowOnHover = true,
  soundOnClick = false,
  loading = false,
  icon = 'none',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const isMedievalVariant = variant.startsWith('medieval-') || medieval;
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // Create ripple effect
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { id, x, y }]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id));
      }, 600);
    }
    
    // Sound effect hook (preparation)
    if (soundOnClick) {
      // Future: Play button click sound
      console.log('🔊 Button click sound would play here');
    }
    
    // Trigger press animation
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    // Call original onClick
    onClick?.(e);
  };

  const getIcon = () => {
    switch (icon) {
      case 'sword':
        return '⚔️';
      case 'shield':
        return '🛡️';
      case 'crown':
        return '👑';
      case 'castle':
        return '🏰';
      case 'flame':
        return '🔥';
      default:
        return null;
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 transform relative overflow-hidden';
    const hoverClasses = glowOnHover ? 'hover:shadow-lg' : '';
    const pressClasses = isPressed ? 'scale-95' : '';
    
    switch (variant) {
      case 'medieval-red':
        return clsx(
          baseClasses,
          'btn-medieval-red',
          hoverClasses,
          pressClasses,
          glowOnHover && 'hover:shadow-red-500/50',
          isHovered && 'shadow-red-500/30'
        );
      
      case 'medieval-blue':
        return clsx(
          baseClasses,
          'btn-medieval-blue',
          hoverClasses,
          pressClasses,
          glowOnHover && 'hover:shadow-blue-500/50',
          isHovered && 'shadow-blue-500/30'
        );
      
      case 'medieval-gold':
        return clsx(
          baseClasses,
          'btn-medieval-gold',
          hoverClasses,
          pressClasses,
          glowOnHover && 'hover:shadow-yellow-500/50',
          isHovered && 'shadow-yellow-500/30'
        );
      
      case 'medieval-stone':
        return clsx(
          baseClasses,
          'btn-medieval-stone',
          hoverClasses,
          pressClasses,
          glowOnHover && 'hover:shadow-gray-500/50',
          isHovered && 'shadow-gray-500/30'
        );
      
      default:
        return clsx(
          baseClasses,
          {
            'btn-primary': variant === 'primary' && !medieval,
            'btn-secondary': variant === 'secondary' && !medieval,
            'btn-primary btn-red': variant === 'red' && !medieval,
            'btn-primary btn-blue': variant === 'blue' && !medieval,
          },
          hoverClasses,
          pressClasses
        );
    }
  };

  return (
    <button
      ref={buttonRef}
      className={clsx(
        getVariantClasses(),
        
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        
        // Size classes
        {
          'px-4 py-2 text-sm': size === 'small',
          'px-6 py-3': size === 'medium',
          'px-8 py-4 text-lg': size === 'large',
        },
        
        // Width
        fullWidth && 'w-full',
        
        // Animation classes
        isMedievalVariant && 'active:animate-button-press',
        !isMedievalVariant && 'active:scale-[0.98]',
        
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {getIcon() && <span>{getIcon()}</span>}
        {children}
      </span>
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white bg-opacity-30 pointer-events-none animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '600ms',
            animationFillMode: 'both'
          }}
        />
      ))}
      
      {/* Glow effect overlay */}
      {glowOnHover && isHovered && isMedievalVariant && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-pulse" />
      )}
      
      {/* Medieval border accent */}
      {isMedievalVariant && (
        <div className="absolute inset-0 rounded-lg border border-medieval-metal-gold opacity-20 pointer-events-none" />
      )}
      
      {/* Disabled state overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg pointer-events-none" />
      )}
    </button>
  );
}