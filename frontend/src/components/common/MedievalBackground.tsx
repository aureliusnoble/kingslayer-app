import { ReactNode } from 'react';
import clsx from 'clsx';
import ParticleSystem from './ParticleSystem';

// Import images to ensure they're bundled correctly
import throneImg from '/backgrounds/throne.png';
import courtImg from '/backgrounds/court.png';
import chamberImg from '/backgrounds/chamber.png';
import battlementsImg from '/backgrounds/battlements.png';

interface MedievalBackgroundProps {
  variant?: 'castle-hall' | 'throne-room' | 'chamber' | 'battlements';
  children: ReactNode;
  particles?: boolean;
  particleType?: 'ambient' | 'medieval-embers' | 'magic';
  particleIntensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export default function MedievalBackground({
  variant = 'castle-hall',
  children,
  particles = false,
  particleType = 'ambient',
  particleIntensity = 'medium',
  className
}: MedievalBackgroundProps) {
  const getBackgroundImage = () => {
    switch (variant) {
      case 'castle-hall':
        return throneImg; // Grand throne hall for Home Screen
      case 'throne-room':
        return courtImg; // Royal court for End Screen
      case 'chamber':
        return chamberImg; // Intimate chamber for gameplay
      case 'battlements':
        return battlementsImg; // Fortress for lobby/waiting
      default:
        return throneImg;
    }
  };

  const backgroundImage = getBackgroundImage();

  return (
    <div className={clsx('relative min-h-screen overflow-hidden', className)}>
      {/* Fallback gradient background (only if image fails to load) */}
      <div 
        className={clsx(
          'absolute inset-0 w-full h-full',
          {
            // Castle hall - warm torchlight with stone atmosphere
            'bg-gradient-to-br from-medieval-stone-dark via-surface-dark to-medieval-stone-dark': variant === 'castle-hall',
            // Throne room - golden lighting with royal atmosphere
            'bg-gradient-to-br from-medieval-metal-gold/15 via-surface-dark to-medieval-metal-copper/15': variant === 'throne-room',
            // Chamber - intimate candlelight with warm glow
            'bg-gradient-to-br from-medieval-flame-orange/8 via-surface-dark to-medieval-flame-orange/8': variant === 'chamber',
            // Battlements - cool stone with fortress atmosphere
            'bg-gradient-to-br from-medieval-stone-light/15 via-surface-dark to-medieval-stone-medium/15': variant === 'battlements',
          }
        )}
        style={{ zIndex: 1 }}
      />
      
      {/* Main background image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          zIndex: 2,
          opacity: 1,
        }}
      />
      
      {/* Light atmospheric overlay for text readability */}
      <div 
        className={clsx(
          'absolute inset-0 w-full h-full',
          {
            // Minimal overlay for throne hall - let the image show through clearly
            'bg-gradient-to-t from-surface-dark/25 via-transparent to-surface-dark/10': variant === 'castle-hall',
            // Subtle golden tint for royal court
            'bg-gradient-to-t from-surface-dark/25 via-medieval-metal-gold/3 to-surface-dark/10': variant === 'throne-room',
            // Warm intimate overlay for chamber
            'bg-gradient-to-t from-surface-dark/20 via-medieval-flame-orange/3 to-surface-dark/8': variant === 'chamber',
            // Cool fortress overlay for battlements
            'bg-gradient-to-t from-surface-dark/25 via-medieval-stone-light/3 to-surface-dark/10': variant === 'battlements',
          }
        )}
        style={{ zIndex: 3 }}
      />

      {/* Enhanced particle system */}
      {particles && (
        <ParticleSystem
          type={particleType}
          intensity={particleIntensity}
          enabled={particles}
          className="absolute inset-0"
        />
      )}
      
      {/* Legacy fallback particles for compatibility */}
      {particles && particleType === 'ambient' && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={clsx(
                'absolute rounded-full',
                {
                  'w-1 h-1 bg-medieval-flame-orange animate-ember-float opacity-30': variant === 'castle-hall' || variant === 'chamber',
                  'w-2 h-2 bg-medieval-metal-gold animate-ember-float opacity-20': variant === 'throne-room',
                  'w-1 h-1 bg-medieval-stone-light animate-ember-float opacity-15': variant === 'battlements',
                }
              )}
              style={{
                left: `${15 + i * 20}%`,
                top: `${25 + (i % 2) * 40}%`,
                animationDelay: `${i * 1.2}s`,
                animationDuration: `${5 + i * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle texture overlay */}
      <div 
        className={clsx(
          'absolute inset-0 opacity-5',
          {
            'texture-stone': variant === 'castle-hall' || variant === 'battlements',
            'texture-metal': variant === 'throne-room',
            'texture-parchment': variant === 'chamber',
          }
        )}
        style={{ zIndex: 5 }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}