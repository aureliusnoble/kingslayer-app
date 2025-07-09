import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface SimpleTransitionProps {
  children: ReactNode;
}

export default function SimpleTransition({ children }: SimpleTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Brief transition effect without blocking content
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen">
      {/* Non-blocking transition effect */}
      {isTransitioning && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {/* Subtle flash effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-medieval-metal-gold to-transparent opacity-5 animate-pulse" />
          
          {/* Corner accents - subtle geometric shapes */}
          <div className="absolute top-4 left-4 w-1 h-1 bg-medieval-metal-gold rounded-full animate-pulse opacity-40"></div>
          <div className="absolute top-4 right-4 w-1 h-1 bg-medieval-metal-gold rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.1s' }}></div>
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-medieval-metal-gold rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute bottom-4 right-4 w-1 h-1 bg-medieval-metal-gold rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.3s' }}></div>
        </div>
      )}
      
      {/* Main content - always visible */}
      <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-95' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
}