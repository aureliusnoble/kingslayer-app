import { Crown } from 'lucide-react';
import clsx from 'clsx';

interface CrownLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  animated?: boolean;
  glow?: boolean;
  className?: string;
}

export default function CrownLogo({
  size = 'medium',
  animated = false,
  glow = false,
  className
}: CrownLogoProps) {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xlarge: 'w-32 h-32'
  };

  const iconSizes = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96
  };

  return (
    <div className={clsx(
      'relative flex items-center justify-center mx-auto',
      sizeClasses[size],
      animated && 'animate-crown-pulse',
      className
    )}>
      {/* Glow effect */}
      {glow && (
        <div className={clsx(
          'absolute inset-0 rounded-full',
          'bg-medieval-metal-gold opacity-20 blur-lg',
          animated && 'animate-crown-pulse'
        )} />
      )}

      {/* Crown icon */}
      <Crown
        size={iconSizes[size]}
        className={clsx(
          'text-medieval-metal-gold relative z-10',
          'drop-shadow-lg filter'
        )}
        style={{
          filter: glow 
            ? 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.4))' 
            : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        }}
      />

      {/* Sparkle effects */}
      {animated && glow && (
        <>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-medieval-flame-yellow rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-medieval-flame-yellow rounded-full animate-ping" 
               style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-0 left-0 w-1 h-1 bg-medieval-flame-yellow rounded-full animate-ping" 
               style={{ animationDelay: '1s' }} />
        </>
      )}
    </div>
  );
}