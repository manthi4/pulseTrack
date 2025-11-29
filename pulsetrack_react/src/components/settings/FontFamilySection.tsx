import React from 'react';
import { Type } from 'lucide-react';
import { Select } from '../ui/Select';
import { useTheme, type FontFamily } from '../../contexts/ThemeContext';
import { PageSection } from '../ui/PageSection';

const FONTS: { label: string; value: FontFamily }[] = [
  { label: 'System Default', value: 'system' },
  { label: 'Inter', value: 'inter' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Open Sans', value: 'open-sans' },
  { label: 'Lato', value: 'lato' },
  { label: 'Montserrat', value: 'montserrat' },
];

export const FontFamilySection: React.FC = () => {
  const { theme, setFontFamily } = useTheme();

  return (
    <PageSection
      icon={Type}
      title="Font Family"
      description="Select a font family for the entire application"
    >
      <div className="space-y-4">
        <Select
          value={theme.fontFamily}
          onChange={(e) => setFontFamily(e.target.value as FontFamily)}
          className="max-w-xs"
        >
          {FONTS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </Select>
        <p className="text-sm text-muted-foreground">
          Preview: <span style={{ fontFamily: `var(--font-family, ${FONTS.find(f => f.value === theme.fontFamily)?.label})` }}>The quick brown fox jumps over the lazy dog</span>
        </p>
      </div>
    </PageSection>
  );
};

