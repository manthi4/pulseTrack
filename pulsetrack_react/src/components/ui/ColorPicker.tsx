import React from 'react';
import { cn } from '../../lib/utils';

export const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  showCustomColor?: boolean;
  showColorValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  showCustomColor = false,
  showColorValue = false,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              sizeClasses[size],
              value === color
                ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-ring scale-110'
                : 'border-border hover:border-foreground/50'
            )}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
            title={color}
          />
        ))}
      </div>
      {showCustomColor && (
        <div className="flex items-center gap-3 pt-2">
          <label htmlFor="custom-color" className="text-sm font-medium">
            Custom Color:
          </label>
          <input
            id="custom-color"
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-20 rounded-md border border-input cursor-pointer"
          />
          {showColorValue && (
            <span className="text-sm text-muted-foreground">{value.toUpperCase()}</span>
          )}
        </div>
      )}
    </div>
  );
};

