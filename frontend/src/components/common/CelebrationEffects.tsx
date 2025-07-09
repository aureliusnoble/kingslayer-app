import { useEffect, useState } from 'react';
import ParticleSystem from './ParticleSystem';
import { useParticleSystem } from './ParticleSystem';

interface CelebrationEffectsProps {
  type: 'victory' | 'role-reveal' | 'game-complete' | 'achievement';
  trigger: boolean;
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
  onComplete?: () => void;
  children?: React.ReactNode;
}

export default function CelebrationEffects({
  type,
  trigger,
  duration = 3000,
  intensity = 'high',
  onComplete,
  children
}: CelebrationEffectsProps) {
  const [isActive, setIsActive] = useState(false);
  const { triggerEffect } = useParticleSystem();

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      
      // Trigger appropriate particle effects
      switch (type) {
        case 'victory':
          triggerEffect('celebration', duration, intensity);
          break;
        case 'role-reveal':
          triggerEffect('role-reveal', duration, intensity);
          break;
        case 'game-complete':
          triggerEffect('victory', duration, intensity);
          setTimeout(() => triggerEffect('celebration', duration / 2, 'medium'), 500);
          break;
        case 'achievement':
          triggerEffect('magic', duration, intensity);
          break;
      }
      
      // Reset after duration
      setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration);
    }
  }, [trigger, isActive, type, duration, intensity, onComplete, triggerEffect]);

  if (!isActive) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      
      {/* Victory celebration */}
      {type === 'victory' && (
        <ParticleSystem
          type="celebration"
          intensity={intensity}
          duration={duration}
          onComplete={onComplete}
        />
      )}
      
      {/* Role reveal effects */}
      {type === 'role-reveal' && (
        <ParticleSystem
          type="role-reveal"
          intensity={intensity}
          duration={duration}
          onComplete={onComplete}
        />
      )}
      
      {/* Game completion effects */}
      {type === 'game-complete' && (
        <>
          <ParticleSystem
            type="victory"
            intensity={intensity}
            duration={duration}
          />
          <ParticleSystem
            type="celebration"
            intensity="medium"
            duration={duration / 2}
            onComplete={onComplete}
          />
        </>
      )}
      
      {/* Achievement effects */}
      {type === 'achievement' && (
        <ParticleSystem
          type="magic"
          intensity={intensity}
          duration={duration}
          onComplete={onComplete}
        />
      )}
      
      {/* Screen flash effect for dramatic moments */}
      {(type === 'victory' || type === 'game-complete') && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-white animate-ping opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-medieval-metal-gold via-medieval-flame-yellow to-medieval-metal-gold animate-pulse opacity-10" />
        </div>
      )}
      
      {/* Role reveal glow */}
      {type === 'role-reveal' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-medieval-metal-gold to-transparent animate-pulse opacity-20" />
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function VictoryCelebration({ 
  trigger, 
  onComplete,
  children 
}: { 
  trigger: boolean; 
  onComplete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <CelebrationEffects
      type="victory"
      trigger={trigger}
      duration={4000}
      intensity="high"
      onComplete={onComplete}
    >
      {children}
    </CelebrationEffects>
  );
}

export function RoleRevealEffect({ 
  trigger, 
  onComplete,
  children 
}: { 
  trigger: boolean; 
  onComplete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <CelebrationEffects
      type="role-reveal"
      trigger={trigger}
      duration={2500}
      intensity="medium"
      onComplete={onComplete}
    >
      {children}
    </CelebrationEffects>
  );
}

export function GameCompleteEffect({ 
  trigger, 
  onComplete,
  children 
}: { 
  trigger: boolean; 
  onComplete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <CelebrationEffects
      type="game-complete"
      trigger={trigger}
      duration={5000}
      intensity="high"
      onComplete={onComplete}
    >
      {children}
    </CelebrationEffects>
  );
}

export function AchievementEffect({ 
  trigger, 
  onComplete,
  children 
}: { 
  trigger: boolean; 
  onComplete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <CelebrationEffects
      type="achievement"
      trigger={trigger}
      duration={3000}
      intensity="medium"
      onComplete={onComplete}
    >
      {children}
    </CelebrationEffects>
  );
}