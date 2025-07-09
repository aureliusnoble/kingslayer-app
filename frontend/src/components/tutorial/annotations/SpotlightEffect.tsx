import { useEffect, useState } from 'react';

interface SpotlightEffectProps {
  target: string; // CSS selector
  intensity?: number; // 0-1, how dark the overlay (default 0.8)
  borderRadius?: number; // Border radius for spotlight (default 8)
  padding?: number; // Extra space around target (default 8)
  transition?: string; // CSS transition for smooth animations
}

interface SpotlightBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function SpotlightEffect({
  target,
  intensity = 0.8,
  borderRadius = 8,
  padding = 8,
  transition = 'all 0.3s ease-in-out'
}: SpotlightEffectProps) {
  const [bounds, setBounds] = useState<SpotlightBounds | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateBounds = () => {
      const element = document.querySelector(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setBounds({
          x: rect.left - padding,
          y: rect.top - padding,
          width: rect.width + (padding * 2),
          height: rect.height + (padding * 2)
        });
        setVisible(true);
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
    };
  }, [target, padding]);

  if (!visible || !bounds) {
    return null;
  }

  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(0, 0, 0, ${intensity})`,
    pointerEvents: 'none' as const,
    zIndex: 9998,
    transition,
    clipPath: `polygon(
      0% 0%, 
      0% 100%, 
      ${bounds.x}px 100%, 
      ${bounds.x}px ${bounds.y}px, 
      ${bounds.x + bounds.width}px ${bounds.y}px, 
      ${bounds.x + bounds.width}px ${bounds.y + bounds.height}px, 
      ${bounds.x}px ${bounds.y + bounds.height}px, 
      ${bounds.x}px 100%, 
      100% 100%, 
      100% 0%
    )`
  };

  return (
    <div style={overlayStyle}>
      {/* Optional: Add a subtle glow effect around the spotlight */}
      <div
        style={{
          position: 'absolute',
          left: bounds.x - 2,
          top: bounds.y - 2,
          width: bounds.width + 4,
          height: bounds.height + 4,
          borderRadius: borderRadius + 2,
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
          pointerEvents: 'none',
          transition
        }}
      />
    </div>
  );
}