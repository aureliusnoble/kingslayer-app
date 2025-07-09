import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../../common/Button';
import { useTutorialStore } from '../../../stores/tutorialStore';

interface TutorialNavigationOverlayProps {
  onNext: () => void;
  onPrevious: () => void;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
}

export default function TutorialNavigationOverlay({
  onNext,
  onPrevious,
  canNavigateNext,
  canNavigatePrevious
}: TutorialNavigationOverlayProps) {
  const navigate = useNavigate();
  const { getTotalSubSteps, getCurrentGlobalStep } = useTutorialStore();
  
  // Use global progress instead of local progress
  const globalStep = getCurrentGlobalStep();
  const totalGlobalSteps = getTotalSubSteps();
  const globalProgress = (globalStep / totalGlobalSteps) * 100;

  return (
    <>
      {/* Back button overlay */}
      <div className="absolute top-6 left-6 z-[10000]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-medieval-metal-gold transition-colors bg-black bg-opacity-50 px-3 py-2 rounded-lg"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[10000]">
        <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-32 bg-medieval-stone-dark rounded-full h-2 border border-medieval-stone-light border-opacity-30">
              <div 
                className="bg-medieval-metal-gold h-2 rounded-full transition-all duration-300 border border-medieval-metal-gold border-opacity-50"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
            <span className="text-sm text-white font-medium whitespace-nowrap">
              {globalStep} of {totalGlobalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[10000]">
        <div className="flex items-center gap-3 bg-black bg-opacity-50 px-4 py-3 rounded-lg">
          <Button
            variant="medieval-stone"
            size="medium"
            onClick={onPrevious}
            disabled={!canNavigatePrevious}
            className="flex items-center gap-2 text-white disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </Button>
          
          <Button
            variant="medieval-gold"
            size="medium"
            onClick={onNext}
            disabled={!canNavigateNext}
            className="flex items-center gap-2 text-white disabled:opacity-50"
          >
            <span>Next</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}