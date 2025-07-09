import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';

interface RouteTransitionManagerProps {
  children: ReactNode;
}

interface TransitionState {
  isTransitioning: boolean;
  previousPath: string;
  currentPath: string;
  transitionType: 'game-flow' | 'navigation' | 'error' | 'reconnect';
  direction: 'forward' | 'backward' | 'neutral';
}

export default function RouteTransitionManager({ children }: RouteTransitionManagerProps) {
  const location = useLocation();
  const { loading, error, connected } = useGameStore();
  const [transitionState, setTransitionState] = useState<TransitionState>({
    isTransitioning: false,
    previousPath: '/',
    currentPath: location.pathname,
    transitionType: 'navigation',
    direction: 'neutral'
  });

  // Route hierarchy for determining transition direction
  const routeHierarchy = [
    '/',
    '/create',
    '/join',
    '/tutorial',
    '/lobby',
    '/role',
    '/game',
    '/end'
  ];

  // Game flow routes
  const gameFlowRoutes = ['/lobby', '/role', '/game', '/end'];

  const getTransitionType = (fromPath: string, toPath: string): TransitionState['transitionType'] => {
    if (error) return 'error';
    if (loading || !connected) return 'reconnect';
    if (gameFlowRoutes.includes(fromPath) && gameFlowRoutes.includes(toPath)) return 'game-flow';
    return 'navigation';
  };

  const getTransitionDirection = (fromPath: string, toPath: string): TransitionState['direction'] => {
    const fromIndex = routeHierarchy.indexOf(fromPath);
    const toIndex = routeHierarchy.indexOf(toPath);
    
    if (fromIndex === -1 || toIndex === -1) return 'neutral';
    if (toIndex > fromIndex) return 'forward';
    if (toIndex < fromIndex) return 'backward';
    return 'neutral';
  };

  const getTransitionClasses = () => {
    const { isTransitioning, transitionType, direction } = transitionState;
    
    if (!isTransitioning) return '';
    
    const baseClasses = 'transition-all duration-500 ease-in-out';
    
    switch (transitionType) {
      case 'game-flow':
        return `${baseClasses} ${direction === 'forward' 
          ? 'animate-in slide-in-from-right-full fade-in' 
          : 'animate-in slide-in-from-left-full fade-in'}`;
        
      case 'navigation':
        return `${baseClasses} animate-in fade-in zoom-in-95`;
        
      case 'error':
        return `${baseClasses} animate-in fade-in duration-300`;
        
      case 'reconnect':
        return `${baseClasses} animate-in fade-in duration-300`;
        
      default:
        return `${baseClasses} animate-in fade-in`;
    }
  };

  const getLoadingOverlay = () => {
    const { transitionType } = transitionState;
    
    if (transitionType === 'game-flow') {
      return (
        <div className="fixed inset-0 z-40 bg-surface-dark bg-opacity-80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-transparent border-t-medieval-metal-gold border-r-medieval-metal-copper rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-transparent border-t-medieval-flame-yellow border-r-medieval-flame-orange rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
            </div>
            <p className="text-medieval-parchment font-display text-base mb-1">
              Entering the {getGamePhaseText()}...
            </p>
            <p className="text-medieval-stone-light text-sm">
              {getTransitionMessage()}
            </p>
          </div>
        </div>
      );
    }
    
    if (transitionType === 'reconnect') {
      return (
        <div className="fixed inset-0 z-50 bg-surface-dark bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-blue-600 rounded-full animate-spin" />
            </div>
            <p className="text-blue-100 font-display text-lg mb-2">
              Reconnecting to realm...
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const getGamePhaseText = () => {
    switch (location.pathname) {
      case '/lobby':
        return 'Great Hall';
      case '/role':
        return 'Role Chamber';
      case '/game':
        return 'Battle Arena';
      case '/end':
        return 'Victory Hall';
      default:
        return 'Kingdom';
    }
  };

  const getTransitionMessage = () => {
    const { direction } = transitionState;
    
    switch (location.pathname) {
      case '/lobby':
        return 'Gathering the nobles...';
      case '/role':
        return 'Revealing your destiny...';
      case '/game':
        return 'The battle begins...';
      case '/end':
        return 'Honor to the victors...';
      default:
        return direction === 'forward' ? 'Advancing...' : 'Retreating...';
    }
  };

  useEffect(() => {
    const previousPath = transitionState.currentPath;
    const currentPath = location.pathname;
    
    if (previousPath !== currentPath) {
      const newTransitionState: TransitionState = {
        isTransitioning: true,
        previousPath,
        currentPath,
        transitionType: getTransitionType(previousPath, currentPath),
        direction: getTransitionDirection(previousPath, currentPath)
      };
      
      setTransitionState(newTransitionState);
      
      // End transition after animation completes
      const timer = setTimeout(() => {
        setTransitionState(prev => ({
          ...prev,
          isTransitioning: false
        }));
      }, newTransitionState.transitionType === 'game-flow' ? 600 : 300);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, transitionState.currentPath, error, loading, connected]);

  return (
    <div className="relative min-h-screen">
      {/* Loading overlay */}
      {transitionState.isTransitioning && getLoadingOverlay()}
      
      {/* Main content */}
      <div className={getTransitionClasses()}>
        {children}
      </div>
      
      {/* Transition effects */}
      {transitionState.isTransitioning && transitionState.transitionType === 'game-flow' && (
        <div className="fixed inset-0 pointer-events-none z-30">
          {/* Screen border effect */}
          <div className="absolute inset-0 border-4 border-medieval-metal-gold animate-pulse opacity-10" />
          
          {/* Corner emblems */}
          <div className="absolute top-4 left-4 text-medieval-metal-gold text-xl animate-pulse opacity-60">⚔️</div>
          <div className="absolute top-4 right-4 text-medieval-metal-gold text-xl animate-pulse opacity-60" style={{ animationDelay: '0.5s' }}>🛡️</div>
          <div className="absolute bottom-4 left-4 text-medieval-metal-gold text-xl animate-pulse opacity-60" style={{ animationDelay: '1s' }}>👑</div>
          <div className="absolute bottom-4 right-4 text-medieval-metal-gold text-xl animate-pulse opacity-60" style={{ animationDelay: '1.5s' }}>🏰</div>
        </div>
      )}
    </div>
  );
}

// Hook for triggering manual transitions
export function useRouteTransition() {
  const location = useLocation();
  const { gameState } = useGameStore();
  
  const triggerTransition = (targetPath: string, delay: number = 0) => {
    setTimeout(() => {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, delay);
  };
  
  const isGameFlowRoute = (path: string) => {
    return ['/lobby', '/role', '/game', '/end'].includes(path);
  };
  
  return {
    currentPath: location.pathname,
    gamePhase: gameState?.phase,
    triggerTransition,
    isGameFlowRoute
  };
}