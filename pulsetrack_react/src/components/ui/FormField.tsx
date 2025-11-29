import React from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  required,
  className,
  labelClassName,
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      <label className={cn("text-sm font-medium", labelClassName)}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

