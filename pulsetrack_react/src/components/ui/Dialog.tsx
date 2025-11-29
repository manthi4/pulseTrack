import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  className,
}) => {
  // Prevent body scroll when dialog is open (important for mobile)
  useEffect(() => {
    if (isOpen) {
      // Save current body overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';

      // Cleanup: restore original overflow style when dialog closes
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Handle overlay click to close dialog
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the overlay, not on the dialog content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent clicks inside dialog from closing it
  const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={handleOverlayClick}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div
        className={cn(
          "w-full rounded-lg bg-card p-4 sm:p-6 shadow-xl border border-border/50 text-card-foreground max-h-[90vh] overflow-y-auto",
          maxWidthClasses[maxWidth],
          className
        )}
        onClick={handleDialogClick}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
