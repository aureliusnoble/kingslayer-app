import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  interactive: boolean;
  skipable: boolean;
  completed: boolean;
}

interface TutorialStore {
  // State
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  skipTutorial: boolean;
  
  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  jumpToStep: (step: number) => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  exitTutorial: () => void;
  setSkipTutorial: (skip: boolean) => void;
  markStepCompleted: (step: number) => void;
  
  // Getters
  getCurrentStepData: () => TutorialStep;
  getProgress: () => number;
  canNavigateNext: () => boolean;
  canNavigatePrevious: () => boolean;
  isStepCompleted: (step: number) => boolean;
  
  // Global progress tracking
  getTotalSubSteps: () => number;
  getCurrentGlobalStep: () => number;
  setCurrentSubStep: (mainStep: number, subStep: number) => void;
  currentSubStep: number;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 0,
    title: 'Welcome to Kingslayer',
    description: 'Learn the basics of this strategic social deduction game',
    interactive: true,
    skipable: true,
    completed: false
  },
  {
    id: 1,
    title: 'Roles & Teams',
    description: 'Understand the role system and team assignments',
    interactive: true,
    skipable: false,
    completed: false
  },
  {
    id: 2,
    title: 'Room Assignment',
    description: 'Learn about physical room separation',
    interactive: true,
    skipable: false,
    completed: false
  },
  {
    id: 3,
    title: 'Game Interface',
    description: 'Explore the main game interface',
    interactive: true,
    skipable: false,
    completed: false
  },
  {
    id: 4,
    title: 'Leadership Election',
    description: 'Master the leadership election system',
    interactive: true,
    skipable: false,
    completed: false
  },
  {
    id: 5,
    title: 'Room Changes',
    description: 'Learn what happens when you are kicked',
    interactive: true,
    skipable: false,
    completed: false
  },
  {
    id: 6,
    title: 'Abilities & Reference',
    description: 'Learn about role abilities and reference tools',
    interactive: true,
    skipable: false,
    completed: false
  },
  {
    id: 7,
    title: 'Kingslayer',
    description: 'Review what you have learned',
    interactive: false,
    skipable: false,
    completed: false
  }
];

export const useTutorialStore = create<TutorialStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      currentStep: 0,
      totalSteps: tutorialSteps.length,
      completedSteps: new Set(),
      skipTutorial: false,
      currentSubStep: 0,
      
      // Actions
      startTutorial: () => {
        set({ 
          isActive: true, 
          currentStep: 0,
          skipTutorial: false,
          currentSubStep: 0
        });
      },
      
      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          const newStep = currentStep + 1;
          set({ currentStep: newStep });
          get().markStepCompleted(currentStep);
        }
      },
      
      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },
      
      jumpToStep: (step: number) => {
        const { totalSteps } = get();
        if (step >= 0 && step < totalSteps) {
          set({ currentStep: step });
        }
      },
      
      completeTutorial: () => {
        const { currentStep, totalSteps } = get();
        set({ 
          isActive: false,
          currentStep: totalSteps - 1,
          completedSteps: new Set(Array.from({ length: totalSteps }, (_, i) => i))
        });
        get().markStepCompleted(currentStep);
      },
      
      resetTutorial: () => {
        set({ 
          isActive: false,
          currentStep: 0,
          completedSteps: new Set(),
          skipTutorial: false,
          currentSubStep: 0
        });
      },
      
      exitTutorial: () => {
        set({ isActive: false });
      },
      
      setSkipTutorial: (skip: boolean) => {
        set({ skipTutorial: skip });
      },
      
      markStepCompleted: (step: number) => {
        const { completedSteps } = get();
        const newCompletedSteps = new Set(completedSteps);
        newCompletedSteps.add(step);
        set({ completedSteps: newCompletedSteps });
      },
      
      // Getters
      getCurrentStepData: () => {
        const { currentStep } = get();
        return tutorialSteps[currentStep] || tutorialSteps[0];
      },
      
      getProgress: () => {
        const { currentStep, totalSteps } = get();
        return ((currentStep + 1) / totalSteps) * 100;
      },
      
      canNavigateNext: () => {
        const { currentStep, totalSteps } = get();
        return currentStep < totalSteps - 1;
      },
      
      canNavigatePrevious: () => {
        const { currentStep } = get();
        return currentStep > 0;
      },
      
      isStepCompleted: (step: number) => {
        const { completedSteps } = get();
        return completedSteps.has(step);
      },
      
      // Global progress tracking methods
      getTotalSubSteps: () => {
        // Sub-steps per tutorial step:
        // Step 0: Home (1 step)
        // Step 1: Role Reveal (2 sub-steps)
        // Step 2: Room Assignment (1 step)
        // Step 3: Game Interface (6 sub-steps)
        // Step 4: Leadership (4 sub-steps)
        // Step 5: Kick Modal (2 sub-steps)
        // Step 6: Abilities (2 sub-steps)
        // Step 7: Summary (1 step)
        // Step 8: Complete (1 step)
        return 1 + 2 + 1 + 6 + 4 + 2 + 2 + 1 + 1; // Total: 20 sub-steps
      },
      
      getCurrentGlobalStep: () => {
        const { currentStep, currentSubStep } = get();
        let globalStep = 0;
        
        // Add completed main steps
        for (let i = 0; i < currentStep; i++) {
          switch (i) {
            case 0: globalStep += 1; break; // Home
            case 1: globalStep += 2; break; // Role Reveal
            case 2: globalStep += 1; break; // Room Assignment
            case 3: globalStep += 6; break; // Game Interface
            case 4: globalStep += 4; break; // Leadership
            case 5: globalStep += 2; break; // Kick Modal
            case 6: globalStep += 2; break; // Abilities
            case 7: globalStep += 1; break; // Summary
            case 8: globalStep += 1; break; // Complete
          }
        }
        
        // Add current sub-step
        globalStep += currentSubStep;
        
        return globalStep;
      },
      
      setCurrentSubStep: (mainStep: number, subStep: number) => {
        set({ currentStep: mainStep, currentSubStep: subStep });
      }
    }),
    {
      name: 'tutorial-storage',
      partialize: (state) => ({
        completedSteps: Array.from(state.completedSteps),
        skipTutorial: state.skipTutorial,
        currentSubStep: state.currentSubStep
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        completedSteps: new Set(persistedState.completedSteps || []),
        skipTutorial: persistedState.skipTutorial || false,
        currentSubStep: persistedState.currentSubStep || 0
      })
    }
  )
);