import React from 'react';
import { CloudSyncSection } from '../components/CloudSyncSection';
import { ThemeModeSection } from '../components/settings/ThemeModeSection';
import { AccentColorSection } from '../components/settings/AccentColorSection';
import { FontFamilySection } from '../components/settings/FontFamilySection';
import { ResetSection } from '../components/settings/ResetSection';

export const Settings: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Customize the appearance of PulseTrack to match your preferences.
          </p>
        </div>

        <ThemeModeSection />
        <AccentColorSection />
        <FontFamilySection />
        <CloudSyncSection />
        <ResetSection />
      </div>
    </div>
  );
};

