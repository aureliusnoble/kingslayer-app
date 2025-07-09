import { ReactNode, cloneElement, ReactElement } from 'react';
import SpotlightEffect from './SpotlightEffect';
import CalloutBubble from './CalloutBubble';
import InteractiveHotspot from './InteractiveHotspot';

export interface TutorialAnnotation {
  id: string;
  type: 'spotlight' | 'callout' | 'hotspot' | 'guided';
  target: string; // CSS selector
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  arrow?: boolean;
  interactive?: boolean;
  delay?: number; // Delay in ms before showing annotation
}

interface TutorialOverlayProps {
  children: ReactNode;
  step: number;
  annotations: TutorialAnnotation[];
  spotlightTarget?: string; // CSS selector for spotlight
  onInteraction?: (action: string) => void;
  onScreenClick?: () => void; // Called when user clicks anywhere on screen
  mockData?: any; // Override props for tutorial mode
  tutorialMode?: boolean;
}

export default function TutorialOverlay({
  children,
  step,
  annotations,
  spotlightTarget,
  onInteraction,
  onScreenClick,
  mockData,
  tutorialMode = true
}: TutorialOverlayProps) {
  
  // Clone the child component and inject tutorial props
  const enhancedChildren = cloneElement(children as ReactElement, {
    ...mockData,
    tutorialMode,
    onTutorialInteraction: onInteraction,
    'data-tutorial-step': step
  });

  // Filter annotations for current step
  const currentAnnotations = annotations.filter(annotation => 
    annotation.type !== 'guided' || annotation.interactive
  );

  return (
    <div className="relative w-full h-full">
      {/* Render the enhanced child component with disabled interactions */}
      <div className="w-full h-full" style={{ pointerEvents: tutorialMode ? 'none' : 'auto' }}>
        {enhancedChildren}
      </div>
      
      {/* Click-intercepting overlay */}
      {tutorialMode && onScreenClick && (
        <div 
          className="absolute inset-0 z-[9997] cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onScreenClick();
          }}
          style={{ pointerEvents: 'auto' }}
        />
      )}
      
      {/* Spotlight Effect */}
      {spotlightTarget && (
        <SpotlightEffect
          target={spotlightTarget}
          intensity={0.8}
          padding={8}
        />
      )}
      
      {/* Render Annotations */}
      {currentAnnotations.map((annotation) => {
        switch (annotation.type) {
          case 'callout':
            return (
              <CalloutBubble
                key={annotation.id}
                target={annotation.target}
                content={annotation.content}
                position={annotation.position || 'top'}
                arrow={annotation.arrow !== false}
                delay={annotation.delay}
              />
            );
          
          case 'hotspot':
            return (
              <InteractiveHotspot
                key={annotation.id}
                target={annotation.target}
                onClick={() => onInteraction?.(annotation.id)}
                pulse={annotation.interactive}
                tooltip={annotation.content}
              />
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
}