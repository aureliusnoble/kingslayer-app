import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { TutorialOverlay } from '../../annotations';
import TutorialNavigationOverlay from '../../annotations/TutorialNavigationOverlay';
import MedievalBackground from '../../../common/MedievalBackground';
import { useTutorialStore } from '../../../../stores/tutorialStore';

interface TutorialRoomAssignmentProps {
  onContinue: () => void;
  onGlobalPrevious?: () => void;
  onGlobalNext?: () => void;
  canGlobalPrevious?: boolean;
  canGlobalNext?: boolean;
  startAtLastStep?: boolean;
}

// Simple content component for room assignment
function RoomAssignmentContent() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white font-display">Room Assignment</h2>
          <p className="text-medieval-stone-light">
            Players are randomly split into two physical rooms. You must move to your assigned room!
          </p>
          <div className="bg-surface-dark bg-opacity-50 p-6 rounded-lg border border-medieval-stone-light">
            <p className="text-white font-semibold mb-2">Important Rules:</p>
            <ul className="text-medieval-stone-light space-y-1 text-sm">
              <li>• No communication between rooms except through the app</li>
              <li>• You can talk freely with players in your room</li>
              <li>• Room assignments are shown in the app</li>
            </ul>
          </div>
          <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-400">
            <p className="text-red-300 font-semibold text-center flex items-center justify-center gap-2">
              <AlertTriangle size={20} />
              You can ONLY show your Role to other players. Do not show them anything else on your screen!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TutorialRoomAssignment({ onContinue, onGlobalPrevious, onGlobalNext, canGlobalPrevious, canGlobalNext, startAtLastStep }: TutorialRoomAssignmentProps) {
  const { setCurrentSubStep } = useTutorialStore();

  // Define annotation steps for room assignment (just one step since it's simple content)
  const annotationSteps = [
    {
      spotlight: '', // No spotlight needed for this content
      annotations: []
    }
  ];

  // Initialize step position based on navigation direction
  const [currentAnnotationStep, setCurrentAnnotationStep] = useState(() => {
    return startAtLastStep ? annotationSteps.length - 1 : 0;
  });

  // Update global progress when sub-step changes
  useEffect(() => {
    setCurrentSubStep(2, currentAnnotationStep + 1);
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
        tutorialMode={true}
      >
        <MedievalBackground variant="castle-hall" particles={true}>
          <RoomAssignmentContent />
        </MedievalBackground>
      </TutorialOverlay>
    </div>
  );
}