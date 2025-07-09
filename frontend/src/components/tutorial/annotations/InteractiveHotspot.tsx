import { useEffect, useState } from 'react';

interface InteractiveHotspotProps {
  target: string; // CSS selector
  onClick: () => void;
  pulse?: boolean; // Visual indicator
  tooltip?: string;
  blockInteraction?: boolean; // Prevent clicks on underlying element
  className?: string;
}

interface HotspotBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function InteractiveHotspot({
  target,
  onClick,
  pulse = true,
  tooltip,
  blockInteraction = false,
  className = ''
}: InteractiveHotspotProps) {
  const [bounds, setBounds] = useState<HotspotBounds | null>(null);
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const updateBounds = () => {
      const element = document.querySelector(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setBounds({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
        setVisible(true);
        
        // Block underlying element interaction if requested
        if (blockInteraction) {
          (element as HTMLElement).style.pointerEvents = 'none';
        }
      } else {
        setVisible(false);
      }
    };

    // Initial bounds calculation
    updateBounds();

    // Update bounds on resize and scroll
    const handleResize = () => updateBounds();
    const handleScroll = () => updateBounds();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver(updateBounds);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      
      // Restore pointer events on cleanup
      if (blockInteraction) {
        const element = document.querySelector(target);
        if (element) {
          (element as HTMLElement).style.pointerEvents = '';
        }
      }
    };
  }, [target, blockInteraction]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  const handleMouseEnter = () => {
    if (tooltip) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  if (!visible || !bounds) {
    return null;
  }

  const pulseClasses = pulse 
    ? 'animate-pulse before:absolute before:inset-0 before:bg-medieval-metal-gold before:opacity-20 before:rounded-lg before:animate-ping'
    : '';

  return (
    <>
      {/* Interactive Hotspot */}
      <div
        className={`fixed z-[9999] cursor-pointer transition-all duration-200 ${pulseClasses} ${className}`}
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '8px'
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Pulse effect overlay */}
        {pulse && (
          <div className="absolute inset-0 bg-medieval-metal-gold opacity-10 rounded-lg animate-pulse" />
        )}
        
        {/* Ripple effect on hover */}
        <div className="absolute inset-0 bg-medieval-metal-gold opacity-0 rounded-lg transition-opacity duration-200 hover:opacity-5" />
      </div>

      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div
          className="fixed z-[10000] pointer-events-none bg-medieval-stone-dark border border-medieval-stone-light rounded-lg px-3 py-2 text-white text-sm shadow-lg transition-all duration-200"
          style={{
            left: bounds.x + bounds.width / 2,
            top: bounds.y - 10,
            transform: 'translate(-50%, -100%)',
            maxWidth: '200px'
          }}
        >
          {tooltip}
          
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-medieval-stone-dark" />
        </div>
      )}
    </>
  );
}