import { useState, useEffect } from 'react';
import { TutorialOverlay } from '../../annotations';
import TutorialNavigationOverlay from '../../annotations/TutorialNavigationOverlay';
import GameScreen from '../../../../screens/GameScreen';
import { getTutorialDataForStep } from '../../../../data/tutorialMockData';
import { useTutorialStore } from '../../../../stores/tutorialStore';

interface TutorialLeadershipProps {
  onContinue: () => void;
  onGlobalPrevious?: () => void;
  onGlobalNext?: () => void;
  canGlobalPrevious?: boolean;
  canGlobalNext?: boolean;
  startAtLastStep?: boolean;
}

export default function TutorialLeadership({ onContinue, onGlobalPrevious, onGlobalNext, canGlobalPrevious, canGlobalNext, startAtLastStep }: TutorialLeadershipProps) {
  const { setCurrentSubStep } = useTutorialStore();

  // Get mock data for leadership scenario
  const mockData = getTutorialDataForStep('leadership');
  const mockRole = mockData.players['you'].role;
  const mockPlayers = Object.values(mockData.players);

  // Define annotation steps focusing on leadership mechanics - streamlined
  const annotationSteps = [
    {
      spotlight: '[data-tutorial="player-list"]',
      annotations: [
        {
          id: 'leadership-discussion',
          type: 'callout' as const,
          target: '[data-tutorial="player-list"]',
          content: 'Discuss with players in your room to choose a leader. When more than 50% of players point at them that person can claim leadership.',
          position: 'right' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="leader-button"]',
      annotations: [
        {
          id: 'leader-button-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="leader-button"]',
          content: 'Tap "Declare Myself Leader" when a majority of people in your room point at you.',
          position: 'top' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="leader-status"]',
      annotations: [
        {
          id: 'leader-powers-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="leader-status"]',
          content: 'As leader, you can send players to the other room after the 2-minute cooldown. Anyone can become leader at any time.',
          position: 'bottom' as const,
          arrow: true
        }
      ]
    },
    {
      spotlight: '[data-tutorial="kick-button"]',
      annotations: [
        {
          id: 'kick-button-explanation',
          type: 'callout' as const,
          target: '[data-tutorial="kick-button"]',
          content: 'When your room timer reaches 0, leaders can use the KICK button to send players to the other room. This resets the timer to 2 minutes.',
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
    setCurrentSubStep(4, currentAnnotationStep + 1);
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

  // Modify the tutorial data to show leadership scenario
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