import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import clsx from 'clsx';
import { Scroll, Crown, Shield } from 'lucide-react';

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  enableSequentialAnimation?: boolean;
  enableCompletionCelebration?: boolean;
  enablePasteAnimation?: boolean;
  onComplete?: (value: string) => void;
}

export interface CodeInputRef {
  focus: () => void;
}

const CodeInput = forwardRef<CodeInputRef, CodeInputProps>(({
  length = 6,
  value,
  onChange,
  className,
  autoFocus = false,
  disabled = false,
  enableSequentialAnimation = true,
  enableCompletionCelebration = true,
  enablePasteAnimation = true,
  onComplete
}, ref) => {
  const [inputs, setInputs] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [pasteAnimationIndex, setPasteAnimationIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRefs.current[0]?.focus();
    }
  }));

  useEffect(() => {
    const newInputs = Array(length).fill('');
    for (let i = 0; i < Math.min(value.length, length); i++) {
      newInputs[i] = value[i] || '';
    }
    setInputs(newInputs);
    
    // Check if completed
    const completed = newInputs.every(input => input !== '') && newInputs.length === length;
    if (completed !== isComplete) {
      setIsComplete(completed);
      
      if (completed) {
        onComplete?.(newInputs.join(''));
        
        if (enableCompletionCelebration) {
          setShowCompletionCelebration(true);
          setTimeout(() => setShowCompletionCelebration(false), 2000);
        }
      }
    }
  }, [value, length, isComplete, onComplete, enableCompletionCelebration]);

  const handleChange = (index: number, inputValue: string) => {
    const newValue = inputValue.slice(-1).toUpperCase(); // Only take last character and uppercase
    const newInputs = [...inputs];
    newInputs[index] = newValue;
    setInputs(newInputs);
    
    // Update parent value
    onChange(newInputs.join(''));
    
    // Move to next input if not empty (use timeout for mobile compatibility)
    if (newValue && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !inputs[index] && index > 0) {
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 10);
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
      }, 10);
    }
    
    if (e.key === 'ArrowRight' && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().slice(0, length);
    const newInputs = Array(length).fill('');
    
    for (let i = 0; i < pastedText.length; i++) {
      newInputs[i] = pastedText[i];
    }
    
    setInputs(newInputs);
    onChange(newInputs.join(''));
    
    // Animate paste if enabled
    if (enablePasteAnimation) {
      for (let i = 0; i < pastedText.length; i++) {
        setTimeout(() => {
          setPasteAnimationIndex(i);
          setTimeout(() => setPasteAnimationIndex(null), 300);
        }, i * 100);
      }
    }
    
    // Focus on the next empty input or the last input (use timeout for mobile compatibility)
    const nextIndex = Math.min(pastedText.length, length - 1);
    setTimeout(() => {
      inputRefs.current[nextIndex]?.focus();
    }, 10);
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const getInputClasses = (index: number, input: string) => {
    const baseClasses = 'w-12 h-12 text-center text-xl font-mono font-bold transition-all duration-200 border-2 rounded-lg focus:outline-none';
    
    const sequentialDelay = enableSequentialAnimation ? `delay-${index * 100}` : '';
    const pasteAnimation = pasteAnimationIndex === index ? 'animate-bounce' : '';
    const focusAnimation = focusedIndex === index ? 'animate-pulse' : '';
    const completionAnimation = isComplete && showCompletionCelebration ? 'animate-pulse' : '';
    
    return clsx(
      baseClasses,
      sequentialDelay,
      pasteAnimation,
      focusAnimation,
      completionAnimation,
      'bg-medieval-stone-medium text-white border-medieval-stone-light',
      'focus:border-medieval-metal-gold focus:shadow-lg',
      'focus:shadow-medieval-metal-gold/20 focus:scale-105',
      input && 'bg-medieval-metal-gold text-surface-dark border-medieval-metal-gold',
      disabled && 'opacity-50 cursor-not-allowed'
    );
  };

  return (
    <div className={clsx('flex gap-2 justify-center relative', className)}>
      {inputs.map((input, index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
              if (autoFocus && index === 0 && el) {
                el.focus();
              }
            }}
            type="text"
            value={input}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => {
              // Select all text on focus for better mobile experience
              e.target.select();
              handleFocus(index);
            }}
            onBlur={handleBlur}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            disabled={disabled}
            className={getInputClasses(index, input)}
            maxLength={1}
          />
          
          {/* Individual input completion effect */}
          {input && showCompletionCelebration && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-1 h-1 bg-medieval-flame-yellow rounded-full animate-ping opacity-60" />
              <div className="absolute bottom-0 left-0 w-1 h-1 bg-medieval-flame-orange rounded-full animate-ping opacity-60" style={{ animationDelay: '0.3s' }} />
            </div>
          )}
        </div>
      ))}
      
      {/* Completion celebration overlay - Medieval themed */}
      {isComplete && showCompletionCelebration && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Medieval scroll unfurling */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8">
            <div className="animate-bounce text-medieval-metal-gold">
              <Scroll size={24} className="animate-pulse" />
            </div>
          </div>
          
          {/* Royal crown appearing */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <Crown size={16} className="text-medieval-metal-gold animate-pulse opacity-80" style={{ animationDelay: '0.3s' }} />
          </div>
          
          {/* Shield emblems on sides */}
          <div className="absolute top-0 left-0 transform -translate-y-4 -translate-x-2">
            <Shield size={14} className="text-medieval-metal-copper animate-pulse opacity-60" style={{ animationDelay: '0.1s' }} />
          </div>
          <div className="absolute top-0 right-0 transform -translate-y-4 translate-x-2">
            <Shield size={14} className="text-medieval-metal-copper animate-pulse opacity-60" style={{ animationDelay: '0.2s' }} />
          </div>
          
          {/* Golden coin particles */}
          <div className="absolute -top-4 left-1/4 w-2 h-2 bg-medieval-flame-yellow rounded-full animate-ping opacity-80" />
          <div className="absolute -top-4 right-1/4 w-2 h-2 bg-medieval-flame-orange rounded-full animate-ping opacity-80" style={{ animationDelay: '0.2s' }} />
          <div className="absolute -top-2 left-1/3 w-1 h-1 bg-medieval-metal-gold rounded-full animate-ping opacity-60" style={{ animationDelay: '0.4s' }} />
          <div className="absolute -top-2 right-1/3 w-1 h-1 bg-medieval-metal-copper rounded-full animate-ping opacity-60" style={{ animationDelay: '0.6s' }} />
          
          {/* Banner effect */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-medieval-metal-gold to-transparent animate-pulse opacity-40" />
        </div>
      )}
    </div>
  );
});

CodeInput.displayName = 'CodeInput';

export default CodeInput;