import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import clsx from 'clsx';

interface TutorialNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
}

export default function TutorialNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canNavigateNext,
  canNavigatePrevious
}: TutorialNavigationProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 bg-medieval-stone-dark rounded-full h-2 border border-medieval-stone-light border-opacity-30">
          <div 
            className="bg-medieval-metal-gold h-2 rounded-full transition-all duration-300 border border-medieval-metal-gold border-opacity-50"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-medieval-stone-light font-medium">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        {/* Left Side - Previous */}
        <div className="flex items-center space-x-3">
          <Button
            variant="medieval-stone"
            size="medium"
            onClick={onPrevious}
            disabled={!canNavigatePrevious}
            className={clsx(
              'flex items-center space-x-2',
              !canNavigatePrevious && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </Button>
        </div>

        {/* Right Side - Next */}
        <div className="flex items-center space-x-3">
          <Button
            variant="medieval-gold"
            size="medium"
            onClick={onNext}
            disabled={!canNavigateNext}
            className={clsx(
              'flex items-center space-x-2 text-white',
              !canNavigateNext && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span>{currentStep === totalSteps - 1 ? 'Complete' : 'Next'}</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}