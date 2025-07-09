import { useEffect, useState } from 'react';

interface CalloutBubbleProps {
  target: string; // CSS selector
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  arrow?: boolean;
  maxWidth?: number;
  className?: string;
  delay?: number; // Delay in ms before showing
}

interface BubblePosition {
  x: number;
  y: number;
  actualPosition: 'top' | 'bottom' | 'left' | 'right';
  showArrow: boolean;
}

export default function CalloutBubble({
  target,
  content,
  position,
  arrow = true,
  maxWidth = 280,
  className = '',
  delay = 0
}: CalloutBubbleProps) {
  const [bubblePosition, setBubblePosition] = useState<BubblePosition | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showBubble = () => {
      const element = document.querySelector(target);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Calculate optimal position
      let actualPosition = position;
      let x = 0;
      let y = 0;

      const bubbleOffset = 12; // Distance from target element
      const bubbleHeight = 100; // Estimated bubble height
      const padding = 20; // Minimum padding from viewport edges

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - bubbleOffset;
          // Check if bubble would go off-screen vertically
          if (y - bubbleHeight < padding) {
            actualPosition = 'bottom';
            y = rect.bottom + bubbleOffset;
          }
          break;
        
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + bubbleOffset;
          // Check if bubble would go off-screen vertically
          if (y + bubbleHeight > viewport.height - padding) {
            actualPosition = 'top';
            y = rect.top - bubbleOffset;
          }
          break;
        
        case 'left':
          x = rect.left - bubbleOffset;
          y = rect.top + rect.height / 2;
          // Check if bubble would go off-screen horizontally
          if (x - maxWidth < padding) {
            actualPosition = 'right';
            x = rect.right + bubbleOffset;
            // Double-check that right position is actually valid
            if (x + maxWidth > viewport.width - padding) {
              // Both left and right are invalid, fallback to bottom
              actualPosition = 'bottom';
              x = rect.left + rect.width / 2;
              y = rect.bottom + bubbleOffset;
            }
          }
          break;
        
        case 'right':
          x = rect.right + bubbleOffset;
          y = rect.top + rect.height / 2;
          // Check if bubble would go off-screen horizontally
          if (x + maxWidth > viewport.width - padding) {
            actualPosition = 'left';
            x = rect.left - bubbleOffset;
            // Double-check that left position is actually valid
            if (x - maxWidth < padding) {
              // Both left and right are invalid, fallback to bottom
              actualPosition = 'bottom';
              x = rect.left + rect.width / 2;
              y = rect.bottom + bubbleOffset;
            }
          }
          break;
      }

      // Ensure horizontal position stays within bounds for top/bottom positioned bubbles
      if (actualPosition === 'top' || actualPosition === 'bottom') {
        const halfWidth = maxWidth / 2;
        if (x - halfWidth < padding) {
          x = halfWidth + padding;
        } else if (x + halfWidth > viewport.width - padding) {
          x = viewport.width - halfWidth - padding;
        }
      }

      // Ensure vertical position stays within bounds for left/right positioned bubbles
      if (actualPosition === 'left' || actualPosition === 'right') {
        const halfHeight = bubbleHeight / 2;
        if (y - halfHeight < padding) {
          y = halfHeight + padding;
        } else if (y + halfHeight > viewport.height - padding) {
          y = viewport.height - halfHeight - padding;
        }
      }

      // Final safety check: ensure callout doesn't go off-screen horizontally
      if (actualPosition === 'left') {
        if (x - maxWidth < padding) {
          x = maxWidth + padding;
          // If even this adjustment puts us off-screen, fall back to centered bottom
          if (x > viewport.width - padding) {
            actualPosition = 'bottom';
            x = Math.min(Math.max(rect.left + rect.width / 2, maxWidth / 2 + padding), viewport.width - maxWidth / 2 - padding);
            y = rect.bottom + bubbleOffset;
          }
        }
      } else if (actualPosition === 'right') {
        if (x + maxWidth > viewport.width - padding) {
          x = viewport.width - maxWidth - padding;
          // If even this adjustment puts us off-screen, fall back to centered bottom
          if (x < padding) {
            actualPosition = 'bottom';
            x = Math.min(Math.max(rect.left + rect.width / 2, maxWidth / 2 + padding), viewport.width - maxWidth / 2 - padding);
            y = rect.bottom + bubbleOffset;
          }
        }
      }

      // Responsive maxWidth adjustment for smaller screens
      const responsiveMaxWidth = Math.min(maxWidth, viewport.width - 2 * padding);
      if (responsiveMaxWidth < maxWidth) {
        console.log('Adjusting maxWidth from', maxWidth, 'to', responsiveMaxWidth, 'for viewport width', viewport.width);
      }

      // Determine if we should show the arrow based on positioning
      const targetRect = element?.getBoundingClientRect();
      let showArrow = arrow;
      
      if (targetRect && arrow) {
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const distance = Math.sqrt(Math.pow(x - targetCenterX, 2) + Math.pow(y - targetCenterY, 2));
        // Hide arrow if bubble is too far from target (indicating it was repositioned)
        showArrow = distance < 200; // Adjust threshold as needed
      }

      // Debug logging for positioning issues
      console.log('Callout positioning debug:', {
        target,
        requestedPosition: position,
        actualPosition,
        targetRect: rect,
        viewport,
        calculatedPosition: { x, y },
        maxWidth,
        responsiveMaxWidth,
        showArrow
      });

      setBubblePosition({ x, y, actualPosition, showArrow });
      setVisible(true);
    };

    const timer = setTimeout(showBubble, delay);

    // Update position on resize and scroll
    const handleResize = () => showBubble();
    const handleScroll = () => showBubble();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [target, position, maxWidth, delay]);

  if (!visible || !bubblePosition) {
    return null;
  }

  const getTransform = () => {
    const { actualPosition } = bubblePosition;
    switch (actualPosition) {
      case 'top':
        return 'translate(-50%, -100%)';
      case 'bottom':
        return 'translate(-50%, 0%)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'right':
        return 'translate(0%, -50%)';
      default:
        return 'translate(-50%, -100%)';
    }
  };

  const getArrowClasses = () => {
    const { actualPosition } = bubblePosition;
    const baseClasses = 'absolute w-0 h-0 border-solid';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-medieval-stone-medium left-1/2 transform -translate-x-1/2 -bottom-2`;
      case 'bottom':
        return `${baseClasses} border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-medieval-stone-medium left-1/2 transform -translate-x-1/2 -top-2`;
      case 'left':
        return `${baseClasses} border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-medieval-stone-medium top-1/2 transform -translate-y-1/2 -right-2`;
      case 'right':
        return `${baseClasses} border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-medieval-stone-medium top-1/2 transform -translate-y-1/2 -left-2`;
      default:
        return `${baseClasses} border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-medieval-stone-medium left-1/2 transform -translate-x-1/2 -bottom-2`;
    }
  };

  return (
    <div
      className={`fixed z-[9999] pointer-events-none transition-all duration-300 animate-in fade-in-0 zoom-in-95 ${className}`}
      style={{
        left: bubblePosition.x,
        top: bubblePosition.y,
        transform: getTransform(),
        maxWidth: `${Math.min(maxWidth, window.innerWidth - 40)}px`
      }}
    >
      <div className="relative bg-medieval-stone-medium border-2 border-medieval-stone-light rounded-lg p-4 shadow-lg">
        <p className="text-white text-sm leading-relaxed font-medium">
          {content}
        </p>
        
        {bubblePosition.showArrow && (
          <div className={getArrowClasses()} />
        )}
      </div>
    </div>
  );
}