import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';

export const ResetSection: React.FC = () => {
  const { resetTheme } = useTheme();

  return (
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-destructive/10">
          <RotateCcw className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-none tracking-tight">Reset Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Restore all appearance settings to their default values
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={resetTheme}
        className="w-full sm:w-auto"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset to Defaults
      </Button>
    </div>
  );
};

