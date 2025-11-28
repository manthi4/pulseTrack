import React from 'react';
import { Type } from 'lucide-react';
import { Select } from '../ui/Select';
import { useTheme, type FontFamily } from '../../contexts/ThemeContext';

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
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Type className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-none tracking-tight">Font Family</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select a font family for the entire application
          </p>
        </div>
      </div>

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
    </div>
  );
};

