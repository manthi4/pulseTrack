import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '../ui/Switch';
import { useTheme } from '../../contexts/ThemeContext';
import { PageSection } from '../ui/PageSection';

export const ThemeModeSection: React.FC = () => {
  const { theme, setMode } = useTheme();

  return (
    <PageSection
      icon={theme.mode === 'dark' ? Moon : Sun}
      title="Theme Mode"
      description="Switch between light and dark mode"
    >
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
    </PageSection>
  );
};

