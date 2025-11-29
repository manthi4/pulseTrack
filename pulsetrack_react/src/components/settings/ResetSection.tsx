import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { PageSection } from '../ui/PageSection';

export const ResetSection: React.FC = () => {
  const { resetTheme } = useTheme();

  return (
    <PageSection
      icon={RotateCcw}
      title="Reset Settings"
      description="Restore all appearance settings to their default values"
      iconBgColor="destructive"
    >
      <Button
        variant="outline"
        onClick={resetTheme}
        className="w-full sm:w-auto"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset to Defaults
      </Button>
    </PageSection>
  );
};

