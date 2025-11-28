import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '../ui/Switch';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeModeSection: React.FC = () => {
  const { theme, setMode } = useTheme();

  return (
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          {theme.mode === 'dark' ? (
            <Moon className="h-5 w-5 text-primary" />
          ) : (
            <Sun className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-none tracking-tight">Theme Mode</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Switch between light and dark mode
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Dark Mode</p>
          <p className="text-sm text-muted-foreground">
            {theme.mode === 'dark' ? 'Dark theme is enabled' : 'Light theme is enabled'}
          </p>
        </div>
        <Switch
          checked={theme.mode === 'dark'}
          onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')}
        />
      </div>
    </div>
  );
};

