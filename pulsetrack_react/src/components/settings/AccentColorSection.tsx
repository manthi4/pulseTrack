import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

const ACCENT_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
];

export const AccentColorSection: React.FC = () => {
  const { theme, setAccentColor } = useTheme();

  return (
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Palette className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-none tracking-tight">Accent Color</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a color that will be used throughout the app
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setAccentColor(color.value)}
              className={cn(
                "w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                theme.accentColor === color.value
                  ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-ring scale-110'
                  : 'border-border hover:border-foreground/50'
              )}
              style={{ backgroundColor: color.value }}
              aria-label={`Select ${color.name} color`}
              title={color.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <label htmlFor="custom-color" className="text-sm font-medium">
            Custom Color:
          </label>
          <input
            id="custom-color"
            type="color"
            value={theme.accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-10 w-20 rounded-md border border-input cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{theme.accentColor.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

