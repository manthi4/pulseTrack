import React from 'react';
import { Palette, Type, Moon, Sun, RotateCcw, Cloud, CloudOff, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { Select } from './ui/Select';
import { useTheme, type FontFamily } from '../contexts/ThemeContext';
import { useCloudSync } from '../hooks/useCloudSync';
import { cn } from '../lib/utils';

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

const FONTS: { label: string; value: FontFamily }[] = [
  { label: 'System Default', value: 'system' },
  { label: 'Inter', value: 'inter' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Open Sans', value: 'open-sans' },
  { label: 'Lato', value: 'lato' },
  { label: 'Montserrat', value: 'montserrat' },
];

export const Settings: React.FC = () => {
  const { theme, setMode, setAccentColor, setFontFamily, resetTheme } = useTheme();
  const { currentUser, syncStatus, isLoading, error, login, logout, sync, isConfigured } = useCloudSync();

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Customize the appearance of PulseTrack to match your preferences.
          </p>
        </div>

        {/* Theme Mode Section */}
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

        {/* Accent Color Section */}
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

        {/* Font Family Section */}
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

        {/* Cloud Sync Section */}
        {isConfigured && (
          <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                {currentUser ? (
                  <Cloud className="h-5 w-5 text-primary" />
                ) : (
                  <CloudOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-none tracking-tight">Cloud Sync</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Sync your data across devices with Dexie Cloud
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {currentUser ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Logged in as</p>
                      <p className="text-sm text-muted-foreground">
                        {currentUser.email || currentUser.name || 'User'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={logout}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>

                  {syncStatus && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Sync Status</span>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          syncStatus.status === 'synced' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                          syncStatus.status === 'syncing' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                          'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                        )}>
                          {syncStatus.status === 'synced' ? 'Synced' :
                           syncStatus.status === 'syncing' ? 'Syncing...' :
                           syncStatus.status === 'error' ? 'Error' : 'Pending'}
                        </span>
                      </div>
                      {syncStatus.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={sync}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    {isLoading ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Log in to enable cloud sync and access your data across all your devices.
                  </p>
                  <Button
                    onClick={login}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    {isLoading ? 'Logging in...' : 'Login to Sync'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset Section */}
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
      </div>
    </div>
  );
};

