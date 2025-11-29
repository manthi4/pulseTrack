import React from 'react';
import { cn } from '../../lib/utils';

interface ActivityBadgeProps {
  name: string;
  color?: string | null;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const ActivityBadge: React.FC<ActivityBadgeProps> = ({
  name,
  color,
  isSelected = false,
  onClick,
  className,
  size = 'md',
}) => {
  const activityColor = color || '#3b82f6';
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isSelected ? 'shadow-md' : 'hover:opacity-80',
          sizeClasses[size],
          className
        )}
        style={{
          backgroundColor: isSelected ? activityColor : `${activityColor}15`,
          borderColor: isSelected ? activityColor : `${activityColor}40`,
          color: isSelected ? 'white' : activityColor,
        }}
      >
        {name}
      </button>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold transition-colors',
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: `${activityColor}40`,
        backgroundColor: `${activityColor}15`,
        color: activityColor,
      }}
    >
      {name}
    </span>
  );
};

