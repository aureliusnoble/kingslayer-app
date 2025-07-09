import { useState, useEffect } from 'react';
import { TutorialOverlay } from '../../annotations';
import TutorialNavigationOverlay from '../../annotations/TutorialNavigationOverlay';
import GameScreen from '../../../../screens/GameScreen';
import { getTutorialDataForStep } from '../../../../data/tutorialMockData';
import { useTutorialStore } from '../../../../stores/tutorialStore';

interface TutorialGameInterfaceProps {
  onContinue: () => void;
  onGlobalPrevious?: () => void;
  onGlobalNext?: () => void;
  canGlobalPrevious?: boolean;
  canGlobalNext?: boolean;
  startAtLastStep?: boolean;
}

export default function TutorialGameInterface({ onContinue, onGlobalPrevious, onGlobalNext, canGlobalPrevious, canGlobalNext, startAtLastStep }: TutorialGameInterfaceProps) {
  const { setCurrentSubStep } = useTutorialStore();

  // Get mock data for game interface scenario
  const mockData = getTutorialDataForStep('gameStart');
  const mockRole = mockData.players['you'].role;
  const mockPlayers = Object.values(mockData.players);

  // Define annotation steps - streamlined room overview and personal actions
  const annotationSteps = [
    {
      spotlight: '[data-tutorial="room-timers"]',
      annotations: [
        {
          id: 'room-timers-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="room-timers"]',
          content: 'Room timers show when leaders can send players between rooms. Each room has a 2-minute cooldown.',
          position: 'bottom' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="player-list"]',
      annotations: [
        {
          id: 'player-list-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="player-list"]',
          content: 'This shows all players in your room. The crown icon shows the leader.',
          position: 'bottom' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="other-room-count"]',
      annotations: [
        {
          id: 'other-room-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="other-room-count"]',
          content: 'You can see the player count in the other room, but not who is there.',
          position: 'top' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="show-role-button"]',
      annotations: [
        {
          id: 'show-role-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="show-role-button"]',
          content: 'Show Role displays your team/role to other players. This is the ONLY screen you should show to others.',
          position: 'bottom' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="role-info-button"]',
      annotations: [
        {
          id: 'role-info-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="role-info-button"]',
          content: 'Role Info shows your detailed abilities. You may NOT show this to others.',
          position: 'bottom' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="ability-button"]',
      annotations: [
        {
          id: 'ability-button-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="ability-button"]',
          content: 'Use your special abilities. You may NOT show this to others.',
          position: 'bottom' as const,
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
    setCurrentSubStep(3, currentAnnotationStep + 1);
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