import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg",
        paddingClasses[padding],
        hover && "transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};


