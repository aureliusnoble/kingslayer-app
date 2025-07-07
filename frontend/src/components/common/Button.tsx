import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'red' | 'blue';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-semibold rounded-lg transition-all duration-200 transform active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'btn-primary': variant === 'primary',
          'btn-secondary': variant === 'secondary',
          'btn-primary btn-red': variant === 'red',
          'btn-primary btn-blue': variant === 'blue',
          'px-4 py-2 text-sm': size === 'small',
          'px-6 py-3': size === 'medium',
          'px-8 py-4 text-lg': size === 'large',
          'w-full': fullWidth,
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}