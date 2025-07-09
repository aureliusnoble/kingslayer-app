import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import MedievalBackground from '../common/MedievalBackground';
import TutorialNavigation from './TutorialNavigation';
import CrownLogo from '../common/CrownLogo';
import { useTutorialStore } from '../../stores/tutorialStore';

interface TutorialLayoutProps {
  title: string;
  children: ReactNode;
  onNext: () => void;
  onPrevious: () => void;
  onExit: () => void;
  currentStep: number;
  totalSteps: number;
  showNavigation?: boolean;
  canNavigateNext?: boolean;
  canNavigatePrevious?: boolean;
  disableClickInterception?: boolean;
}

export default function TutorialLayout({
  title,
  children,
  onNext,
  onPrevious,
  onExit,
  currentStep,
  totalSteps,
  showNavigation = true,
  canNavigateNext = true,
  canNavigatePrevious = true,
  disableClickInterception = false
}: TutorialLayoutProps) {
  const { getTotalSubSteps, getCurrentGlobalStep } = useTutorialStore();
  
  // Use global progress instead of local progress
  const globalStep = getCurrentGlobalStep();
  const totalGlobalSteps = getTotalSubSteps();
  
  // Add click interception wrapper for non-annotated steps
  const handleScreenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canNavigateNext) {
      onNext();
    }
  };
  return (
    <MedievalBackground variant="castle-hall" particles={true}>
      <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-white hover:text-medieval-metal-gold transition-colors"
            style={{ zIndex: 10001 }}
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold flex-1 text-center text-white font-display">
            {title}
          </h1>
          <div className="w-16" />
        </div>
        
        <div className="max-w-md mx-auto w-full flex flex-col h-full relative">
          
          {/* Crown Logo with more spacing */}
          <div className="text-center mb-12">
            <CrownLogo size="large" animated={true} glow={true} />
          </div>

          {/* Content with conditional click interception */}
          <div className="flex-1 flex flex-col justify-center mb-8 relative">
            {children}
            
            {/* Click-intercepting overlay - only if not disabled */}
            {!disableClickInterception && (
              <div 
                className="absolute inset-0 z-[9997] cursor-pointer"
                onClick={handleScreenClick}
                style={{ pointerEvents: 'auto' }}
              />
            )}
          </div>

          {/* Navigation with global progress */}
          {showNavigation && (
            <div className="relative z-[10000]">
              <TutorialNavigation
                currentStep={globalStep}
                totalSteps={totalGlobalSteps}
                onNext={onNext}
                onPrevious={onPrevious}
                canNavigateNext={canNavigateNext}
                canNavigatePrevious={canNavigatePrevious}
              />
            </div>
          )}
        </div>
      </div>
    </MedievalBackground>
  );
}