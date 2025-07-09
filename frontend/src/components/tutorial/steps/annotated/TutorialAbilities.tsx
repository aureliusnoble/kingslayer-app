import { useState, useEffect } from 'react';
import { TutorialOverlay } from '../../annotations';
import TutorialNavigationOverlay from '../../annotations/TutorialNavigationOverlay';
import GameScreen from '../../../../screens/GameScreen';
import { getTutorialDataForStep } from '../../../../data/tutorialMockData';
import { useTutorialStore } from '../../../../stores/tutorialStore';

interface TutorialAbilitiesProps {
  onContinue: () => void;
  onGlobalPrevious?: () => void;
  onGlobalNext?: () => void;
  canGlobalPrevious?: boolean;
  canGlobalNext?: boolean;
  startAtLastStep?: boolean;
}

export default function TutorialAbilities({ onContinue, onGlobalPrevious, onGlobalNext, canGlobalPrevious, canGlobalNext, startAtLastStep }: TutorialAbilitiesProps) {
  const { setCurrentSubStep } = useTutorialStore();

  // Get mock data for abilities scenario
  const mockData = getTutorialDataForStep('abilities');
  const mockRole = mockData.players['you'].role;
  const mockPlayers = Object.values(mockData.players);

  // Define annotation steps focusing on abilities and reference tools
  const annotationSteps = [

    {
      spotlight: '[data-tutorial="roster-button"]',
      annotations: [
        {
          id: 'roster-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="roster-button"]',
          content: 'Roster shows all the roles currently in the game.',
          position: 'top' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="rules-button"]',
      annotations: [
        {
          id: 'rules-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="rules-button"]',
          content: 'Rules provides quick reference for game mechanics.',
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
    setCurrentSubStep(6, currentAnnotationStep + 1);
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
    currentRoom: 0 as const,
    players: mockPlayers,
    timers: mockData.timers
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
        <GameScreen
          tutorialMode={true}
          tutorialData={tutorialData}
          onTutorialInteraction={() => {}} // No interaction needed
        />
      </TutorialOverlay>
    </div>
  );
}