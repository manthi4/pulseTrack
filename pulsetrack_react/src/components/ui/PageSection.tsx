import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  // Header props (optional)
  icon?: LucideIcon | React.ReactNode;
  title?: string;
  description?: string;
  iconBgColor?: 'primary' | 'destructive' | 'muted' | 'success' | 'warning';
  // Layout variants
  variant?: 'default' | 'compact';
  // Padding
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const PageSection: React.FC<PageSectionProps> = ({
  children,
  className,
  icon,
  title,
  description,
  iconBgColor = 'primary',
  variant = 'default',
  padding = 'md',
}) => {
  const iconBgClasses = {
    primary: 'bg-primary/10',
    destructive: 'bg-destructive/10',
    muted: 'bg-muted',
    success: 'bg-green-500/10',
    warning: 'bg-orange-500/10',
  };

  const iconColorClasses = {
    primary: 'text-primary',
    destructive: 'text-destructive',
    muted: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-orange-600 dark:text-orange-400',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={cn("h-5 w-5", iconColorClasses[iconBgColor])} />;
    }
    return null;
  };

  const hasHeader = icon || title || description;

  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg",
      paddingClasses[padding],
      variant === 'compact' && "shadow-sm",
      className
    )}>
      {hasHeader && (
        <div className={cn(
          "flex items-center gap-3",
          variant === 'default' && "mb-6",
          variant === 'compact' && "mb-4"
        )}>
          {icon && (
            <div className={cn("p-2 rounded-lg shrink-0", iconBgClasses[iconBgColor])}>
              {renderIcon()}
            </div>
          )}
          {(title || description) && (
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className={cn(
                  "font-semibold leading-none tracking-tight",
                  variant === 'default' ? "text-xl" : "text-lg"
                )}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={cn(
                  "text-muted-foreground mt-1",
                  variant === 'default' ? "text-sm" : "text-xs"
                )}>
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

