import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type FontFamily = 'system' | 'inter' | 'roboto' | 'open-sans' | 'lato' | 'montserrat';

interface ThemeSettings {
  mode: ThemeMode;
  accentColor: string;
  fontFamily: FontFamily;
}

interface ThemeContextType {
  theme: ThemeSettings;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setFontFamily: (font: FontFamily) => void;
  resetTheme: () => void;
}

const defaultTheme: ThemeSettings = {
  mode: 'dark',
  accentColor: '#3b82f6', // blue-500
  fontFamily: 'system',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'pulsetrack-theme-settings';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    // Load from localStorage or use default
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    }
    return defaultTheme;
  });

  // Apply theme to document
  useEffect(() => {
    // Apply dark mode class
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply accent color
    const root = document.documentElement;
    const hsl = hexToHsl(theme.accentColor);
    if (hsl) {
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      // Calculate appropriate foreground color
      const foregroundL = hsl.l > 50 ? 10 : 98;
      root.style.setProperty('--primary-foreground', `${hsl.h} ${hsl.s}% ${foregroundL}%`);
      // Update ring color
      root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    }

    // Apply font family
    const fontMap: Record<FontFamily, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      roboto: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      lato: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      montserrat: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    };
    root.style.setProperty('--font-family', fontMap[theme.fontFamily]);
    document.body.style.fontFamily = fontMap[theme.fontFamily];

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  }, [theme]);

  const setMode = (mode: ThemeMode) => {
    setTheme((prev) => ({ ...prev, mode }));
  };

  const setAccentColor = (color: string) => {
    setTheme((prev) => ({ ...prev, accentColor: color }));
  };

  const setFontFamily = (font: FontFamily) => {
    setTheme((prev) => ({ ...prev, fontFamily: font }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setMode, setAccentColor, setFontFamily, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

