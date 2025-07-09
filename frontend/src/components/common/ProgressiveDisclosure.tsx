import { useState, useRef, useEffect, ReactNode } from 'react';
import clsx from 'clsx';

interface ProgressiveDisclosureProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  animationType?: 'accordion' | 'fade' | 'slide' | 'scale' | 'medieval' | 'stagger';
  duration?: number;
  delay?: number;
  staggerDelay?: number;
  onAnimationComplete?: () => void;
}

export default function ProgressiveDisclosure({
  isOpen,
  children,
  className,
  animationType = 'accordion',
  duration = 300,
  delay = 0,
  staggerDelay = 100,
  onAnimationComplete
}: ProgressiveDisclosureProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen !== isVisible) {
      setIsAnimating(true);
      
      if (animationType === 'accordion') {
        if (isOpen) {
          setIsVisible(true);
          setHeight(0);
          setTimeout(() => {
            if (contentRef.current) {
              setHeight(contentRef.current.scrollHeight);
            }
          }, 10);
        } else {
          if (contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
            setTimeout(() => setHeight(0), 10);
          }
        }
      } else {
        if (isOpen) {
          setIsVisible(true);
        }
      }
      
      // Handle animation completion
      setTimeout(() => {
        if (!isOpen && animationType === 'accordion') {
          setIsVisible(false);
        }
        if (isOpen && animationType === 'accordion') {
          setHeight('auto');
        }
        setIsAnimating(false);
        onAnimationComplete?.();
      }, duration + delay);
    }
  }, [isOpen, isVisible, animationType, duration, delay, onAnimationComplete]);

  const getContainerClasses = () => {
    const baseClasses = 'relative overflow-hidden';
    
    switch (animationType) {
      case 'accordion':
        return clsx(
          baseClasses,
          'transition-all ease-in-out',
          isAnimating && 'duration-300'
        );
      
      case 'fade':
        return clsx(
          baseClasses,
          'transition-opacity ease-in-out',
          isAnimating && `duration-${duration}`,
          isVisible && isOpen ? 'opacity-100' : 'opacity-0'
        );
      
      case 'slide':
        return clsx(
          baseClasses,
          'transition-transform ease-in-out',
          isAnimating && `duration-${duration}`,
          isVisible && isOpen ? 'transform translate-y-0' : 'transform -translate-y-full'
        );
      
      case 'scale':
        return clsx(
          baseClasses,
          'transition-transform ease-in-out',
          isAnimating && `duration-${duration}`,
          isVisible && isOpen ? 'transform scale-100' : 'transform scale-0'
        );
      
      case 'medieval':
        return clsx(
          baseClasses,
          'transition-all ease-in-out',
          isAnimating && `duration-${duration}`,
          isVisible && isOpen 
            ? 'opacity-100 transform scale-100 rotate-0' 
            : 'opacity-0 transform scale-95 rotate-1'
        );
      
      case 'stagger':
        return clsx(baseClasses, 'space-y-2');
      
      default:
        return baseClasses;
    }
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <div 
      className={clsx(getContainerClasses(), className)}
      style={{
        height: animationType === 'accordion' ? height : 'auto',
        transitionDelay: `${delay}ms`
      }}
    >
      <div ref={contentRef} className="w-full">
        {animationType === 'stagger' ? (
          <StaggeredChildren 
            isOpen={isOpen} 
            delay={staggerDelay}
            duration={duration}
          >
            {children}
          </StaggeredChildren>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Staggered animation wrapper
function StaggeredChildren({ 
  isOpen, 
  delay, 
  duration, 
  children 
}: { 
  isOpen: boolean; 
  delay: number; 
  duration: number; 
  children: ReactNode;
}) {
  const childrenArray = Array.isArray(children) ? children : [children];
  
  return (
    <>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={clsx(
            'transition-all ease-out',
            isOpen 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-4'
          )}
          style={{
            transitionDelay: `${index * delay}ms`,
            transitionDuration: `${duration}ms`
          }}
        >
          {child}
        </div>
      ))}
    </>
  );
}

// Accordion-style disclosure component
export function AccordionDisclosure({
  title,
  children,
  defaultOpen = false,
  className,
  titleClassName,
  contentClassName
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx('medieval-accordion', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between p-4 text-left',
          'transition-all duration-200 hover:bg-medieval-stone-medium/20',
          'focus:outline-none focus:ring-2 focus:ring-medieval-metal-gold/50',
          titleClassName
        )}
      >
        <span className="font-semibold">{title}</span>
        <span 
          className={clsx(
            'transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0'
          )}
        >
          ⌄
        </span>
      </button>
      
      <ProgressiveDisclosure
        isOpen={isOpen}
        animationType="accordion"
        duration={300}
        className={contentClassName}
      >
        <div className="p-4 pt-0">
          {children}
        </div>
      </ProgressiveDisclosure>
    </div>
  );
}

// Reveal animation for game elements
export function RevealAnimation({
  trigger,
  children,
  animationType = 'medieval',
  duration = 500,
  delay = 0
}: {
  trigger: boolean;
  children: ReactNode;
  animationType?: 'fade' | 'scale' | 'medieval' | 'slide';
  duration?: number;
  delay?: number;
}) {
  return (
    <ProgressiveDisclosure
      isOpen={trigger}
      animationType={animationType}
      duration={duration}
      delay={delay}
    >
      {children}
    </ProgressiveDisclosure>
  );
}

// List reveal animation
export function ListRevealAnimation({
  items,
  isRevealed,
  staggerDelay = 100,
  itemClassName,
  containerClassName
}: {
  items: ReactNode[];
  isRevealed: boolean;
  staggerDelay?: number;
  itemClassName?: string;
  containerClassName?: string;
}) {
  return (
    <div className={clsx('space-y-2', containerClassName)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={clsx(
            'transition-all duration-500 ease-out',
            isRevealed 
              ? 'opacity-100 transform translate-y-0 scale-100' 
              : 'opacity-0 transform translate-y-4 scale-95',
            itemClassName
          )}
          style={{
            transitionDelay: `${index * staggerDelay}ms`
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

// Medieval-themed expansion panel
export function MedievalExpansionPanel({
  title,
  children,
  defaultOpen = false,
  icon,
  className
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx(
      'bg-medieval-stone-medium/30 rounded-lg border-2 border-medieval-stone-light/20',
      'transition-all duration-200',
      isOpen && 'border-medieval-metal-gold/40 shadow-lg shadow-medieval-metal-gold/20',
      className
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between p-4 text-left',
          'transition-all duration-200 hover:bg-medieval-stone-light/10',
          'focus:outline-none focus:ring-2 focus:ring-medieval-metal-gold/50',
          'font-display font-semibold text-medieval-parchment'
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-medieval-metal-gold">{icon}</span>}
          <span>{title}</span>
        </div>
        <span 
          className={clsx(
            'text-medieval-metal-gold transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0'
          )}
        >
          ⌄
        </span>
      </button>
      
      <ProgressiveDisclosure
        isOpen={isOpen}
        animationType="medieval"
        duration={400}
      >
        <div className="p-4 pt-0 text-medieval-parchment">
          {children}
        </div>
      </ProgressiveDisclosure>
    </div>
  );
}

// Game element reveal with special effects
export function GameElementReveal({
  isRevealed,
  children,
  effectType = 'standard',
  onRevealComplete
}: {
  isRevealed: boolean;
  children: ReactNode;
  effectType?: 'standard' | 'dramatic' | 'magical';
  onRevealComplete?: () => void;
}) {
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (isRevealed) {
      setShowEffect(true);
      setTimeout(() => {
        setShowEffect(false);
        onRevealComplete?.();
      }, 1000);
    }
  }, [isRevealed, onRevealComplete]);

  return (
    <div className="relative">
      <ProgressiveDisclosure
        isOpen={isRevealed}
        animationType="medieval"
        duration={600}
        onAnimationComplete={onRevealComplete}
      >
        {children}
      </ProgressiveDisclosure>
      
      {/* Special effects overlay */}
      {showEffect && effectType === 'dramatic' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-medieval-metal-gold to-transparent opacity-30 animate-pulse" />
          <div className="absolute top-0 left-0 w-2 h-2 bg-medieval-flame-yellow rounded-full animate-ping opacity-80" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-medieval-flame-orange rounded-full animate-ping opacity-80" style={{ animationDelay: '0.2s' }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-medieval-metal-gold rounded-full animate-ping opacity-80" style={{ animationDelay: '0.4s' }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-medieval-metal-copper rounded-full animate-ping opacity-80" style={{ animationDelay: '0.6s' }} />
        </div>
      )}
      
      {showEffect && effectType === 'magical' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-purple-400 rounded-full animate-ping opacity-60" />
        </div>
      )}
    </div>
  );
}