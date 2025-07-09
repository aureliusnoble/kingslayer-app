import { useState, useEffect } from 'react';
import { TutorialOverlay } from '../../annotations';
import TutorialNavigationOverlay from '../../annotations/TutorialNavigationOverlay';
import RoleRevealScreen from '../../../../screens/RoleRevealScreen';
import { getTutorialDataForStep } from '../../../../data/tutorialMockData';
import { useTutorialStore } from '../../../../stores/tutorialStore';

interface TutorialRoleRevealProps {
  onContinue: () => void;
  onGlobalPrevious?: () => void;
  onGlobalNext?: () => void;
  canGlobalPrevious?: boolean;
  canGlobalNext?: boolean;
  startAtLastStep?: boolean;
}

export default function TutorialRoleReveal({ onContinue, onGlobalPrevious, onGlobalNext, canGlobalPrevious, canGlobalNext, startAtLastStep }: TutorialRoleRevealProps) {
  const { setCurrentSubStep } = useTutorialStore();

  // Get mock data for role reveal scenario
  const mockData = getTutorialDataForStep('roleReveal');
  const mockRole = mockData.players['you'].role;

  // Define annotation steps - streamlined with privacy emphasis
  const annotationSteps = [
    {
      spotlight: '[data-tutorial="role-card"]',
      annotations: [
        {
          id: 'role-card-intro',
          type: 'callout' as const,
          target: '[data-tutorial="role-card"]',
          content: 'This is your secret role and team assignment. You\'ll later be able to share this with others using the app.',
          position: 'bottom' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="info-button"]',
      annotations: [
        {
          id: 'info-button-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="info-button"]',
          content: 'Tap the info button to see your role\'s abilities and description.',
          position: 'bottom' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="ready-button"]',
      annotations: [
        {
          id: 'ready-button-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="ready-button"]',
          content: 'When you\'re ready to continue, tap this button to proceed to room assignment.',
          position: 'top' as const,
          arrow: true
        }
      ]
    }
  ];

  // Initialize step position based on navigation direction
  const [currentAnnotationStep, setCurrentAnnotationStep] = useState(() => {
    return startAtLastStep ? annotationSteps.length - 1 : 0;
  });

  // Update global progress when sub-step changes
  useEffect(() => {
    setCurrentSubStep(1, currentAnnotationStep + 1);
  }, [currentAnnotationStep, setCurrentSubStep]);

  const currentStep = annotationSteps[currentAnnotationStep];

  const handleNext = () => {
    if (currentAnnotationStep < annotationSteps.length - 1) {
      setCurrentAnnotationStep(currentAnnotationStep + 1);
    } else {
      onGlobalNext ? onGlobalNext() : onContinue();
    }
  };

  const handlePrevious = () => {
    if (currentAnnotationStep > 0) {
      setCurrentAnnotationStep(currentAnnotationStep - 1);
    } else {
      onGlobalPrevious?.();
    }
  };

  const canNavigateNext = canGlobalNext ?? true;
  const canNavigatePrevious = currentAnnotationStep > 0 || (canGlobalPrevious ?? false);

  const tutorialData = {
    gameState: mockData,
    myRole: mockRole,
    currentRoom: 0 as const
  };

  return (
    <div className="relative w-full h-full">
      <TutorialNavigationOverlay
        onNext={handleNext}
        onPrevious={handlePrevious}
        canNavigateNext={canNavigateNext}
        canNavigatePrevious={canNavigatePrevious}
      />

      <TutorialOverlay
        step={currentAnnotationStep}
        annotations={currentStep.annotations}
        spotlightTarget={currentStep.spotlight}
        onInteraction={() => {}} // No interaction needed
        onScreenClick={handleNext} // Advance tutorial on any screen click
        mockData={tutorialData}
        tutorialMode={true}
      >
        <RoleRevealScreen
          tutorialMode={true}
          tutorialData={tutorialData}
          onTutorialInteraction={() => {}} // No interaction needed
        />
      </TutorialOverlay>
    </div>
  );
}