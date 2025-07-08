import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function CodeInput({
  length = 6,
  value,
  onChange,
  className,
  autoFocus = false,
  disabled = false
}: CodeInputProps) {
  const [inputs, setInputs] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const newInputs = Array(length).fill('');
    for (let i = 0; i < Math.min(value.length, length); i++) {
      newInputs[i] = value[i] || '';
    }
    setInputs(newInputs);
  }, [value, length]);

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
    
    // Focus on the next empty input or the last input (use timeout for mobile compatibility)
    const nextIndex = Math.min(pastedText.length, length - 1);
    setTimeout(() => {
      inputRefs.current[nextIndex]?.focus();
    }, 10);
  };

  return (
    <div className={clsx('flex gap-2 justify-center', className)}>
      {inputs.map((input, index) => (
        <input
          key={index}
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
          }}
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
          disabled={disabled}
          className={clsx(
            'w-12 h-12 text-center text-xl font-mono font-bold transition-all duration-200',
            'border-2 rounded-lg focus:outline-none',
            'bg-medieval-stone-medium text-white border-medieval-stone-light',
            'focus:border-medieval-metal-gold focus:shadow-lg',
            'focus:shadow-medieval-metal-gold/20 focus:scale-105',
            input && 'bg-medieval-metal-gold text-surface-dark border-medieval-metal-gold',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          maxLength={1}
        />
      ))}
    </div>
  );
}