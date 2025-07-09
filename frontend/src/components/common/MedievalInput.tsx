import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react';
import clsx from 'clsx';

interface MedievalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'parchment' | 'stone' | 'metal';
  label?: string;
  error?: string;
  success?: boolean;
  fullWidth?: boolean;
  validationPattern?: RegExp;
  enableRealTimeValidation?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  enableTypingAnimation?: boolean;
  glowOnFocus?: boolean;
}

const MedievalInput = forwardRef<HTMLInputElement, MedievalInputProps>(({
  variant = 'parchment',
  label,
  error,
  success = false,
  fullWidth = true,
  validationPattern,
  enableRealTimeValidation = false,
  showCharacterCount = false,
  maxLength,
  enableTypingAnimation = true,
  glowOnFocus = true,
  className,
  onChange,
  onFocus,
  onBlur,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSuccess, setHasSuccess] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [localValue, setLocalValue] = useState(value || '');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);

  useEffect(() => {
    if (typeof value === 'string') {
      setLocalValue(value);
      setCharacterCount(value.length);
    }
  }, [value]);

  useEffect(() => {
    if (success && !showSuccessAnimation) {
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 1000);
    }
  }, [success, showSuccessAnimation]);

  useEffect(() => {
    if (error && !showErrorAnimation) {
      setShowErrorAnimation(true);
      setTimeout(() => setShowErrorAnimation(false), 600);
    }
  }, [error, showErrorAnimation]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setIsTyping(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setCharacterCount(newValue.length);
    
    if (enableTypingAnimation) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 200);
    }

    // Real-time validation
    if (enableRealTimeValidation && validationPattern) {
      const isValid = validationPattern.test(newValue);
      setHasError(!isValid && newValue.length > 0);
      setHasSuccess(isValid && newValue.length > 0);
    }

    onChange?.(e);
  };

  const getInputClasses = () => {
    const baseClasses = 'transition-all duration-300 focus:outline-none relative';
    const focusClasses = isFocused ? 'transform scale-102' : '';
    const typingClasses = isTyping && enableTypingAnimation ? 'animate-pulse' : '';
    const errorClasses = (error || hasError) ? 'border-red-primary shadow-red-primary/30 animate-shake' : '';
    const successClasses = (success || hasSuccess) ? 'border-green-500 shadow-green-500/30' : '';
    const glowClasses = glowOnFocus && isFocused ? 'shadow-lg' : '';

    return clsx(
      baseClasses,
      focusClasses,
      typingClasses,
      errorClasses,
      successClasses,
      glowClasses,
      {
        'input-parchment texture-parchment': variant === 'parchment',
        'input-stone texture-stone': variant === 'stone',
        'input-metal texture-metal': variant === 'metal',
        'w-full': fullWidth,
      }
    );
  };

  const getLabelClasses = () => {
    const baseClasses = 'block text-sm font-medium transition-all duration-300';
    const focusClasses = isFocused ? 'transform scale-105' : '';
    const colorClasses = {
      'text-medieval-stone-dark': variant === 'parchment',
      'text-white': variant === 'stone' || variant === 'metal',
    };

    return clsx(baseClasses, focusClasses, colorClasses);
  };

  return (
    <div className={clsx('space-y-2 relative', fullWidth && 'w-full')}>
      {label && (
        <label className={getLabelClasses()}>
          {label}
          {showCharacterCount && maxLength && (
            <span className="ml-2 text-xs opacity-60">
              ({characterCount}/{maxLength})
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          className={clsx(
            getInputClasses(),
            showErrorAnimation && 'animate-shake',
            className
          )}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            // Prevent mobile keyboards from auto-advancing to next input
            if (e.key === 'Enter' || e.key === 'Next') {
              e.preventDefault();
              e.currentTarget.blur();
            }
            // Call any existing onKeyDown handler
            if (props.onKeyDown) {
              props.onKeyDown(e);
            }
          }}
          autoCorrect="off"
          spellCheck="false"
          enterKeyHint="done"
          maxLength={maxLength}
          {...props}
        />
        
        {/* Success animation particles */}
        {showSuccessAnimation && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-2 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-80" />
            <div className="absolute top-3 right-6 w-0.5 h-0.5 bg-green-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-4 right-4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-80" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && enableTypingAnimation && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-medieval-metal-gold rounded-full animate-pulse" />
          </div>
        )}
        
        {/* Focus glow effect */}
        {isFocused && glowOnFocus && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-medieval-metal-gold to-transparent opacity-10 animate-pulse pointer-events-none rounded-lg" />
        )}
        
        {/* Medieval border accent */}
        {variant !== 'parchment' && (
          <div className="absolute inset-0 rounded-lg border border-medieval-metal-gold opacity-20 pointer-events-none" />
        )}
      </div>
      
      {/* Error message with animation */}
      {error && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
          <p className="text-sm text-red-highlight font-medium flex items-center gap-1">
            <span className="text-red-400">⚠️</span>
            {error}
          </p>
        </div>
      )}
      
      {/* Success message with animation */}
      {(success || hasSuccess) && !error && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
          <p className="text-sm text-green-400 font-medium flex items-center gap-1">
            <span className="text-green-400">✅</span>
            {success === true ? 'Input is valid' : 'Looks good!'}
          </p>
        </div>
      )}
      
      {/* Character count */}
      {showCharacterCount && maxLength && (
        <div className="flex justify-end">
          <span className={clsx(
            'text-xs transition-colors duration-200',
            characterCount > maxLength * 0.8 ? 'text-orange-400' : 'text-gray-400',
            characterCount === maxLength ? 'text-red-400' : ''
          )}>
            {characterCount}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
});

MedievalInput.displayName = 'MedievalInput';

export default MedievalInput;