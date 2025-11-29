import React from 'react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface ButtonGroupOption<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface ButtonGroupProps<T extends string> {
  options: ButtonGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'compact';
}

export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'sm',
  variant = 'default',
}: ButtonGroupProps<T>) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs h-7',
    default: 'px-3 sm:px-4 py-1.5 text-xs sm:text-sm',
  };

  const containerClasses = variant === 'compact' 
    ? 'inline-flex rounded-md border border-input bg-background p-0.5'
    : 'inline-flex rounded-lg border border-input bg-background p-1';

  return (
    <div className={cn(containerClasses, className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          size={size}
          onClick={() => onChange(option.value)}
          className={cn(
            sizeClasses[size],
            'font-medium transition-all flex-1 sm:flex-initial',
            value === option.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {option.icon ? (
            option.icon
          ) : (
            option.label
          )}
        </Button>
      ))}
    </div>
  );
}

