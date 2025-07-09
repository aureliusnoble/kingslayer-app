import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
  type?: 'fade' | 'slide' | 'scale' | 'medieval' | 'auto';
  direction?: 'left' | 'right' | 'up' | 'down';
}

export default function PageTransition({
  children,
  duration = 300,
  type = 'auto',
  direction = 'right'
}: PageTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  // Auto-determine transition type based on route
  const getTransitionType = () => {
    if (type !== 'auto') return type;
    
    const path = location.pathname;
    if (path === '/') return 'fade';
    if (path.includes('/game') || path.includes('/role')) return 'medieval';
    if (path.includes('/lobby') || path.includes('/end')) return 'slide';
    return 'fade';
  };

  const getTransitionDirection = () => {
    const path = location.pathname;
    const prevPath = sessionStorage.getItem('prevPath') || '/';
    
    // Game flow progression
    const gameFlow = ['/', '/lobby', '/role', '/game', '/end'];
    const currentIndex = gameFlow.indexOf(path);
    const prevIndex = gameFlow.indexOf(prevPath);
    
    if (currentIndex > prevIndex) return 'right';
    if (currentIndex < prevIndex) return 'left';
    return direction;
  };

  const getTransitionClasses = (entering: boolean) => {
    const transitionType = getTransitionType();
    const transitionDirection = getTransitionDirection();
    
    const baseClasses = `transition-all duration-${duration}`;
    
    switch (transitionType) {
      case 'fade':
        return entering
          ? `${baseClasses} opacity-0 animate-in fade-in`
          : `${baseClasses} opacity-100 animate-out fade-out`;
      
      case 'slide':
        const slideDirection = transitionDirection === 'right' ? 'left' : 'right';
        return entering
          ? `${baseClasses} transform translate-x-full animate-in slide-in-from-${slideDirection}-full`
          : `${baseClasses} transform translate-x-0 animate-out slide-out-to-${slideDirection}-full`;
      
      case 'scale':
        return entering
          ? `${baseClasses} transform scale-95 opacity-0 animate-in zoom-in-95 fade-in`
          : `${baseClasses} transform scale-100 opacity-100 animate-out zoom-out-95 fade-out`;
      
      case 'medieval':
        return entering
          ? `${baseClasses} transform scale-95 opacity-0 animate-in zoom-in-95 fade-in duration-500`
          : `${baseClasses} transform scale-100 opacity-100 animate-out zoom-out-95 fade-out duration-500`;
      
      default:
        return entering
          ? `${baseClasses} opacity-0 animate-in fade-in`
          : `${baseClasses} opacity-100 animate-out fade-out`;
    }
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = sessionStorage.getItem('prevPath');
    
    if (prevPath !== currentPath) {
      setIsTransitioning(true);
      
      // Store current path for next transition
      sessionStorage.setItem('prevPath', currentPath);
      
      // Delay showing new content
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, duration / 2);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, children, duration]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Page loading overlay for medieval transitions */}
      {isTransitioning && getTransitionType() === 'medieval' && (
        <div className="fixed inset-0 z-50 bg-surface-dark flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-transparent border-t-medieval-metal-gold border-r-medieval-metal-copper rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-transparent border-t-medieval-flame-yellow border-r-medieval-flame-orange rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
            </div>
            <p className="text-medieval-parchment font-display text-sm">
              Transitioning realms...
            </p>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div
        className={`min-h-screen ${getTransitionClasses(!isTransitioning)}`}
        style={{
          animationDuration: `${duration}ms`,
          animationFillMode: 'both'
        }}
      >
        {displayChildren}
      </div>
      
      {/* Medieval transition effects */}
      {getTransitionType() === 'medieval' && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Floating embers during transition */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-medieval-flame-yellow rounded-full animate-pulse opacity-60" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-medieval-metal-gold rounded-full animate-ping opacity-40" />
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-medieval-flame-orange rounded-full animate-pulse opacity-60" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-medieval-metal-copper rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }} />
        </div>
      )}
    </div>
  );
}

// Screen-specific transition wrapper components
export function GameScreenTransition({ children }: { children: ReactNode }) {
  return (
    <PageTransition type="medieval" duration={500}>
      {children}
    </PageTransition>
  );
}

export function MenuScreenTransition({ children }: { children: ReactNode }) {
  return (
    <PageTransition type="fade" duration={300}>
      {children}
    </PageTransition>
  );
}

export function LobbyScreenTransition({ children }: { children: ReactNode }) {
  return (
    <PageTransition type="slide" duration={400}>
      {children}
    </PageTransition>
  );
}

// Hook for programmatic transitions
export function usePageTransition() {
  const location = useLocation();
  
  const triggerTransition = (callback: () => void, delay: number = 150) => {
    // Add a slight delay to allow for exit animation
    setTimeout(callback, delay);
  };
  
  return {
    currentPath: location.pathname,
    triggerTransition
  };
}