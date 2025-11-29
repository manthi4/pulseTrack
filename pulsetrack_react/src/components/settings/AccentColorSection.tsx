import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PageSection } from '../ui/PageSection';
import { ColorPicker } from '../ui/ColorPicker';

const ACCENT_COLORS = [
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export const AccentColorSection: React.FC = () => {
  const { theme, setAccentColor } = useTheme();

  return (
    <PageSection
      icon={Palette}
      title="Accent Color"
      description="Choose a color that will be used throughout the app"
    >
      <ColorPicker
        value={theme.accentColor}
        onChange={setAccentColor}
        colors={ACCENT_COLORS}
        showCustomColor
        showColorValue
      />
    </PageSection>
  );
};

