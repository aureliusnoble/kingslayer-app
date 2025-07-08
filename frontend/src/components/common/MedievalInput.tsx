import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface MedievalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'parchment' | 'stone' | 'metal';
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const MedievalInput = forwardRef<HTMLInputElement, MedievalInputProps>(({
  variant = 'parchment',
  label,
  error,
  fullWidth = true,
  className,
  ...props
}, ref) => {
  return (
    <div className={clsx('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label className={clsx(
          'block text-sm font-medium',
          {
            'text-medieval-stone-dark': variant === 'parchment',
            'text-white': variant === 'stone' || variant === 'metal',
          }
        )}>
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        className={clsx(
          'transition-all duration-200 focus:outline-none',
          {
            'input-parchment texture-parchment': variant === 'parchment',
            'input-stone texture-stone': variant === 'stone',
            'input-metal texture-metal': variant === 'metal',
            'w-full': fullWidth,
          },
          error && 'border-red-primary shadow-red-primary/30',
          className
        )}
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
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-highlight font-medium">{error}</p>
      )}
    </div>
  );
});

MedievalInput.displayName = 'MedievalInput';

export default MedievalInput;