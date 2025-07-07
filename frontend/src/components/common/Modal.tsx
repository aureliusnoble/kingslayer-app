import { ReactNode } from 'react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className={clsx(
        'relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden',
        className
      )}>
        {title && (
          <div className="px-6 py-4 border-b border-neutral-light">
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
        )}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}