import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useTutorialStore } from '../stores/tutorialStore';
import TutorialLayout from '../components/tutorial/TutorialLayout';
import TutorialHome from '../components/tutorial/steps/TutorialHome';
import TutorialComplete from '../components/tutorial/steps/TutorialComplete';
import QuickReference from '../components/tutorial/QuickReference';
import { 
  TutorialRoleReveal, 
  TutorialRoomAssignment,
  TutorialGameInterface, 
  TutorialLeadership, 
  TutorialKickModal,
  TutorialAbilities 
} from '../components/tutorial/steps/annotated';

export default function TutorialScreen() {
  const navigate = useNavigate();
  const [showQuickReference, setShowQuickReference] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'previous'>('next');
  
  const {
    currentStep,
    totalSteps,
    startTutorial,
    nextStep,
    previousStep,
    resetTutorial,
    exitTutorial,
    getCurrentStepData,
    canNavigateNext,
    canNavigatePrevious,
    setCurrentSubStep
  } = useTutorialStore();

  useEffect(() => {
    // Always reset tutorial to beginning when entering tutorial screen
    resetTutorial();
    startTutorial();
  }, []); // Empty dependency array to run only on mount
  
  // Update global progress for non-annotated steps
  useEffect(() => {
    // Update progress for simple steps (non-annotated)
    switch (currentStep) {
      case 0: setCurrentSubStep(0, 1); break; // Home
      case 7: setCurrentSubStep(7, 1); break; // Summary
      case 8: setCurrentSubStep(8, 1); break; // Complete
      // Annotated steps handle their own progress
    }
  }, [currentStep, setCurrentSubStep]);

  const handleNext = () => {
    setNavigationDirection('next');
    if (currentStep === totalSteps - 1) {
      // On the last step, go back to tutorial home instead of completing
      resetTutorial();
      startTutorial();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    setNavigationDirection('previous');
    previousStep();
  };


  const handleExit = () => {
    exitTutorial();
    navigate('/');
  };

  const handleStartTutorial = () => {
    nextStep();
  };

  const handleContinue = () => {
    nextStep();
  };

  const handleCreateGame = () => {
    exitTutorial();
    navigate('/create');
  };

  const handleJoinGame = () => {
    exitTutorial();
    navigate('/join');
  };

  const handleReplayTutorial = () => {
    resetTutorial();
    startTutorial();
  };

  const handleQuickReference = () => {
    setShowQuickReference(true);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <TutorialHome 
            onStartTutorial={handleStartTutorial}
            onQuickReference={handleQuickReference}
          />
        );
      case 1:
        return (
          <TutorialRoleReveal 
            onContinue={handleContinue}
            onGlobalPrevious={handlePrevious}
            onGlobalNext={handleNext}
            canGlobalPrevious={canNavigatePrevious()}
            canGlobalNext={canNavigateNext()}
            startAtLastStep={navigationDirection === 'previous'}
          />
        );
      case 2:
        return (
          <TutorialRoomAssignment 
            onContinue={handleContinue}
            onGlobalPrevious={handlePrevious}
            onGlobalNext={handleNext}
            canGlobalPrevious={canNavigatePrevious()}
            canGlobalNext={canNavigateNext()}
            startAtLastStep={navigationDirection === 'previous'}
          />
        );
      case 3:
        return (
          <TutorialGameInterface 
            onContinue={handleContinue}
            onGlobalPrevious={handlePrevious}
            onGlobalNext={handleNext}
            canGlobalPrevious={canNavigatePrevious()}
            canGlobalNext={canNavigateNext()}
            startAtLastStep={navigationDirection === 'previous'}
          />
        );
      case 4:
        return (
          <TutorialLeadership 
            onContinue={handleContinue}
            onGlobalPrevious={handlePrevious}
            onGlobalNext={handleNext}
            canGlobalPrevious={canNavigatePrevious()}
            canGlobalNext={canNavigateNext()}
            startAtLastStep={navigationDirection === 'previous'}
          />
        );
      case 5:
        return (
          <TutorialKickModal 
            onContinue={handleContinue}
            onGlobalPrevious={handlePrevious}
            onGlobalNext={handleNext}
            canGlobalPrevious={canNavigatePrevious()}
            canGlobalNext={canNavigateNext()}
            startAtLastStep={navigationDirection === 'previous'}
          />
        );
      case 6:
        return (
          <TutorialAbilities 
            onContinue={handleContinue}
            onGlobalPrevious={handlePrevious}
            onGlobalNext={handleNext}
            canGlobalPrevious={canNavigatePrevious()}
            canGlobalNext={canNavigateNext()}
            startAtLastStep={navigationDirection === 'previous'}
          />
        );
      case 7:
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-white font-display">Tutorial Summary</h2>
            <p className="text-medieval-stone-light">
              You now know the basics of Kingslayer!
            </p>
            <div className="space-y-4 text-left">
              <div className="bg-surface-dark bg-opacity-50 p-4 rounded-lg border border-medieval-stone-light">
                <p className="text-medieval-metal-gold font-semibold mb-2">Remember:</p>
                <ul className="text-medieval-stone-light text-sm space-y-1">
                  <li>• Your goal is to have the enemy King assassinated</li>
                  <li>• Use discussion and app features to coordinate</li>
                  <li>• Leaders can send players between rooms after cooldowns</li>
                  <li>• Each role has unique abilities - use them strategically</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <TutorialComplete
            onCreateGame={handleCreateGame}
            onJoinGame={handleJoinGame}
            onQuickReference={handleQuickReference}
            onReplayTutorial={handleReplayTutorial}
          />
        );
      default:
        return (
          <TutorialHome 
            onStartTutorial={handleStartTutorial}
            onQuickReference={handleQuickReference}
          />
        );
    }
  };

  const stepData = getCurrentStepData();
  const showNavigation = currentStep > 0 && currentStep < totalSteps;
  
  // Steps that use annotation-based real screens don't need the layout wrapper
  const annotationSteps = [1, 2, 3, 4, 5, 6];
  const isAnnotationStep = annotationSteps.includes(currentStep);

  if (isAnnotationStep) {
    return (
      <>
        {renderCurrentStep()}
        <QuickReference
          isOpen={showQuickReference}
          onClose={() => setShowQuickReference(false)}
        />
      </>
    );
  }

  return (
    <>
      <TutorialLayout
        title={stepData.title}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onExit={handleExit}
        showNavigation={showNavigation}
        canNavigateNext={canNavigateNext() || currentStep === totalSteps - 1}
        canNavigatePrevious={canNavigatePrevious()}
        disableClickInterception={currentStep === 0}
      >
        {renderCurrentStep()}
      </TutorialLayout>

      <QuickReference
        isOpen={showQuickReference}
        onClose={() => setShowQuickReference(false)}
      />
    </>
  );
}