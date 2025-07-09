import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  type: 'ember' | 'spark' | 'star' | 'flame' | 'dust' | 'celebration';
}

interface ParticleSystemProps {
  type: 'ambient' | 'victory' | 'role-reveal' | 'medieval-embers' | 'celebration' | 'magic';
  intensity?: 'low' | 'medium' | 'high';
  duration?: number; // in milliseconds, 0 for infinite
  onComplete?: () => void;
  className?: string;
  enabled?: boolean;
}

export default function ParticleSystem({
  type,
  intensity = 'medium',
  duration = 0,
  onComplete,
  className,
  enabled = true
}: ParticleSystemProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(enabled);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const getParticleConfig = () => {
    switch (type) {
      case 'ambient':
        return {
          maxParticles: intensity === 'low' ? 5 : intensity === 'medium' ? 8 : 12,
          spawnRate: intensity === 'low' ? 0.5 : intensity === 'medium' ? 1 : 1.5,
          colors: ['#EA580C', '#FBBF24', '#D97706', '#C2410C'],
          sizes: [1, 2],
          types: ['ember', 'dust'] as const,
          physics: { gravity: -0.1, wind: 0.02 }
        };
      
      case 'victory':
        return {
          maxParticles: intensity === 'low' ? 15 : intensity === 'medium' ? 25 : 40,
          spawnRate: intensity === 'low' ? 2 : intensity === 'medium' ? 3 : 5,
          colors: ['#FBBF24', '#D97706', '#22C55E', '#3B82F6', '#EF4444'],
          sizes: [2, 3, 4],
          types: ['celebration', 'star', 'spark'] as const,
          physics: { gravity: 0.1, wind: 0.1 }
        };
      
      case 'role-reveal':
        return {
          maxParticles: intensity === 'low' ? 10 : intensity === 'medium' ? 15 : 20,
          spawnRate: intensity === 'low' ? 1 : intensity === 'medium' ? 2 : 3,
          colors: ['#D97706', '#C2410C', '#FBBF24'],
          sizes: [1, 2, 3],
          types: ['spark', 'flame', 'ember'] as const,
          physics: { gravity: 0.05, wind: 0.05 }
        };
      
      case 'medieval-embers':
        return {
          maxParticles: intensity === 'low' ? 8 : intensity === 'medium' ? 12 : 16,
          spawnRate: intensity === 'low' ? 0.8 : intensity === 'medium' ? 1.2 : 1.8,
          colors: ['#EA580C', '#FBBF24', '#D97706'],
          sizes: [1, 2],
          types: ['ember', 'flame'] as const,
          physics: { gravity: -0.05, wind: 0.03 }
        };
      
      case 'celebration':
        return {
          maxParticles: intensity === 'low' ? 20 : intensity === 'medium' ? 30 : 50,
          spawnRate: intensity === 'low' ? 3 : intensity === 'medium' ? 5 : 8,
          colors: ['#FBBF24', '#22C55E', '#3B82F6', '#EF4444', '#A855F7'],
          sizes: [2, 3, 4, 5],
          types: ['celebration', 'star', 'spark'] as const,
          physics: { gravity: 0.15, wind: 0.05 }
        };
      
      case 'magic':
        return {
          maxParticles: intensity === 'low' ? 12 : intensity === 'medium' ? 18 : 25,
          spawnRate: intensity === 'low' ? 1.5 : intensity === 'medium' ? 2.5 : 3.5,
          colors: ['#A855F7', '#EC4899', '#3B82F6', '#FBBF24'],
          sizes: [1, 2, 3],
          types: ['spark', 'star', 'dust'] as const,
          physics: { gravity: 0, wind: 0.1 }
        };
      
      default:
        return {
          maxParticles: 8,
          spawnRate: 1,
          colors: ['#EA580C', '#FBBF24'],
          sizes: [1, 2],
          types: ['ember'] as const,
          physics: { gravity: -0.1, wind: 0.02 }
        };
    }
  };

  const createParticle = (config: ReturnType<typeof getParticleConfig>): Particle => {
    const particleType = config.types[Math.floor(Math.random() * config.types.length)];
    const size = config.sizes[Math.floor(Math.random() * config.sizes.length)];
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    
    let x, y, vx, vy;
    
    switch (type) {
      case 'victory':
      case 'celebration':
        x = Math.random() * window.innerWidth;
        y = window.innerHeight + 10;
        vx = (Math.random() - 0.5) * 4;
        vy = -(Math.random() * 8 + 4);
        break;
      
      case 'role-reveal':
        x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
        y = window.innerHeight / 2 + (Math.random() - 0.5) * 100;
        vx = (Math.random() - 0.5) * 3;
        vy = (Math.random() - 0.5) * 3;
        break;
      
      case 'magic':
        x = Math.random() * window.innerWidth;
        y = Math.random() * window.innerHeight;
        vx = (Math.random() - 0.5) * 2;
        vy = (Math.random() - 0.5) * 2;
        break;
      
      default:
        x = Math.random() * window.innerWidth;
        y = window.innerHeight + 10;
        vx = (Math.random() - 0.5) * 2;
        vy = -(Math.random() * 3 + 1);
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx,
      vy,
      size,
      color,
      opacity: 1,
      life: 0,
      maxLife: Math.random() * 3000 + 2000, // 2-5 seconds
      type: particleType
    };
  };

  const updateParticles = (deltaTime: number) => {
    const config = getParticleConfig();
    
    setParticles(prevParticles => {
      let newParticles = [...prevParticles];
      
      // Update existing particles
      newParticles = newParticles.map(particle => {
        const newParticle = { ...particle };
        
        // Update position
        newParticle.x += newParticle.vx * deltaTime * 0.1;
        newParticle.y += newParticle.vy * deltaTime * 0.1;
        
        // Apply physics
        newParticle.vy += config.physics.gravity * deltaTime * 0.1;
        newParticle.vx += config.physics.wind * deltaTime * 0.1;
        
        // Update life
        newParticle.life += deltaTime;
        newParticle.opacity = Math.max(0, 1 - (newParticle.life / newParticle.maxLife));
        
        return newParticle;
      });
      
      // Remove dead particles
      newParticles = newParticles.filter(particle => 
        particle.life < particle.maxLife &&
        particle.x > -50 &&
        particle.x < window.innerWidth + 50 &&
        particle.y > -50 &&
        particle.y < window.innerHeight + 50
      );
      
      // Add new particles
      if (isActive && newParticles.length < config.maxParticles) {
        const shouldSpawn = Math.random() < config.spawnRate * deltaTime * 0.001;
        if (shouldSpawn) {
          newParticles.push(createParticle(config));
        }
      }
      
      return newParticles;
    });
  };

  const animate = (currentTime: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
      startTimeRef.current = currentTime;
    }
    
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    
    // Check if duration has elapsed
    if (duration > 0 && currentTime - startTimeRef.current >= duration) {
      setIsActive(false);
      if (particles.length === 0) {
        onComplete?.();
        return;
      }
    }
    
    updateParticles(deltaTime);
    
    if (isActive || particles.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (enabled && isActive) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, isActive]);

  useEffect(() => {
    setIsActive(enabled);
  }, [enabled]);

  const getParticleClasses = (particle: Particle) => {
    const baseClasses = 'absolute rounded-full pointer-events-none transform';
    
    switch (particle.type) {
      case 'ember':
        return clsx(baseClasses, 'animate-pulse');
      case 'spark':
        return clsx(baseClasses, 'animate-ping');
      case 'star':
        return clsx(baseClasses, 'animate-spin');
      case 'flame':
        return clsx(baseClasses, 'animate-pulse');
      case 'dust':
        return clsx(baseClasses, 'animate-pulse');
      case 'celebration':
        return clsx(baseClasses, 'animate-bounce');
      default:
        return baseClasses;
    }
  };

  if (!enabled) return null;

  return (
    <div className={clsx('fixed inset-0 pointer-events-none z-50', className)}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className={getParticleClasses(particle)}
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: `translate(-50%, -50%) scale(${particle.opacity})`,
          }}
        />
      ))}
    </div>
  );
}

// Hook for easy particle system management
export function useParticleSystem() {
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  
  const triggerEffect = (
    type: ParticleSystemProps['type'],
    duration: number = 3000,
    _intensity: ParticleSystemProps['intensity'] = 'medium'
  ) => {
    const id = `${type}-${Date.now()}`;
    setActiveEffects(prev => [...prev, id]);
    
    setTimeout(() => {
      setActiveEffects(prev => prev.filter(effectId => effectId !== id));
    }, duration);
    
    return id;
  };
  
  const stopEffect = (id: string) => {
    setActiveEffects(prev => prev.filter(effectId => effectId !== id));
  };
  
  const stopAllEffects = () => {
    setActiveEffects([]);
  };
  
  return {
    activeEffects,
    triggerEffect,
    stopEffect,
    stopAllEffects
  };
}