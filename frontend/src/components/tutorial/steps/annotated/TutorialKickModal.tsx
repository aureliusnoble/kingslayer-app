import { useState, useEffect } from 'react';
import { TutorialOverlay } from '../../annotations';
import TutorialNavigationOverlay from '../../annotations/TutorialNavigationOverlay';
import RoomChangeModal from '../../../game/RoomChangeModal';
import GameScreen from '../../../../screens/GameScreen';
import { getTutorialDataForStep } from '../../../../data/tutorialMockData';
import { useTutorialStore } from '../../../../stores/tutorialStore';

interface TutorialKickModalProps {
  onContinue: () => void;
  onGlobalPrevious?: () => void;
  onGlobalNext?: () => void;
  canGlobalPrevious?: boolean;
  canGlobalNext?: boolean;
  startAtLastStep?: boolean;
}

export default function TutorialKickModal({ onContinue, onGlobalPrevious, onGlobalNext, canGlobalPrevious, canGlobalNext, startAtLastStep }: TutorialKickModalProps) {
  const { setCurrentSubStep } = useTutorialStore();

  // Get mock data for kick modal scenario
  const mockData = getTutorialDataForStep('gameStart');
  const mockRole = mockData.players['you'].role;
  const mockPlayers = Object.values(mockData.players);

  // Define annotation steps for kick modal
  const annotationSteps = [
    {
      spotlight: '', // Full screen modal
      annotations: [
        {
          id: 'kick-modal-explanation',
          type: 'callout' as const,
          target: 'h1',
          content: 'When you are kicked by a leader, this screen appears. It shows you which room you must move to.',
          position: 'bottom' as const,
          arrow: true,
          delay: 500
        }
      ]
    },
    {
      spotlight: '.bg-red-primary.bg-opacity-20', // Focus on room assignment
      annotations: [
        {
          id: 'kick-modal-room',
          type: 'callout' as const,
          target: '.bg-red-primary.bg-opacity-20',
          content: 'This shows your new room assignment. You must physically move to this room.',
          position: 'bottom' as const,
          arrow: true,
          delay: 500
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
    setCurrentSubStep(5, currentAnnotationStep + 1);
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
        currentStep={currentAnnotationStep}
        totalSteps={annotationSteps.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canNavigateNext={canNavigateNext}
        canNavigatePrevious={canNavigatePrevious}
      />

      {/* Show the kick modal overlay */}
      <RoomChangeModal
        isVisible={true}
        newRoom={1}
        onConfirm={() => {}} // No action needed in tutorial
        blocking={true}
      />

      {/* Show the game screen behind the modal */}
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