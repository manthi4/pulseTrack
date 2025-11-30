import React, { useState } from 'react';
import { Activity, LogIn, LogOut, Download, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useFitbit } from '../hooks/useFitbit';
import { PageSection } from './ui/PageSection';
import { cn } from '../lib/utils';
import { useAppData } from '../hooks/useAppData';
import { createSession, getActivities, getSessions, createActivity } from '../lib/db';
import { format } from 'date-fns';

export const FitbitSection: React.FC = () => {
  const { isConnected, isLoading, error, userId, connect, disconnect, fetchSleepDataRange } = useFitbit();
  const { refreshData } = useAppData();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleImportSleepData = async () => {
    if (!isConnected) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      // Import last 30 days of sleep data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const response = await fetchSleepDataRange(startDateStr, endDateStr);
      
      if (!response || !response.sleep || response.sleep.length === 0) {
        setImportError('No sleep data found for the selected date range.');
        setIsImporting(false);
        return;
      }

      // Get or create Sleep activity
      const activities = await getActivities();
      let sleepActivity = activities.find(a => a.name.toLowerCase() === 'sleep');
      
      if (!sleepActivity) {
        const sleepSyncId = await createActivity({
          name: 'Sleep',
          goal: 8,
          goal_scale: 'daily',
          color: '#3b82f6',
        });
        const updatedActivities = await getActivities();
        sleepActivity = updatedActivities.find(a => a.sync_id === sleepSyncId);
      }

      if (!sleepActivity) {
        throw new Error('Failed to create or find Sleep activity');
      }

      // Convert Fitbit sleep logs to sessions
      let importedCount = 0;
      let skippedCount = 0;

      for (const sleepLog of response.sleep) {
        // Only import main sleep logs
        if (!sleepLog.isMainSleep) continue;

        const startTime = new Date(sleepLog.startTime).getTime();
        const endTime = new Date(sleepLog.endTime).getTime();

        // Check if session already exists (by checking if we have a session with same start time within 1 hour)
        const existingSessions = await getSessions();
        const existing = existingSessions.find(s => 
          Math.abs(s.start_time - startTime) < 3600000 && // Within 1 hour
          s.activity_ids.includes(sleepActivity!.sync_id)
        );

        if (existing) {
          skippedCount++;
          continue;
        }

        // Create session name from date
        const sleepDate = new Date(sleepLog.dateOfSleep);
        const sessionName = `Sleep - ${format(sleepDate, 'MMM d, yyyy')}`;

        await createSession({
          name: sessionName,
          start_time: startTime,
          end_time: endTime,
          activity_ids: [sleepActivity.sync_id],
        });

        importedCount++;
      }

      await refreshData();

      if (importedCount > 0) {
        setImportSuccess(`Successfully imported ${importedCount} sleep session${importedCount !== 1 ? 's' : ''}.`);
        if (skippedCount > 0) {
          setImportSuccess(prev => `${prev} ${skippedCount} duplicate session${skippedCount !== 1 ? 's' : ''} skipped.`);
        }
      } else {
        setImportError('No new sleep sessions to import. All sessions may already exist.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import sleep data';
      setImportError(message);
      console.error('Error importing Fitbit sleep data:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const displayError = error || importError;

  return (
    <PageSection
      icon={Activity}
      title="Fitbit Integration"
      description="Import your sleep data from Fitbit"
      iconBgColor={isConnected ? 'primary' : 'muted'}
    >
      {displayError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {displayError}
        </div>
      )}

      {importSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
          {importSuccess}
        </div>
      )}

      <div className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected to Fitbit</p>
                {userId && (
                  <p className="text-sm text-muted-foreground">
                    User ID: {userId}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={disconnect}
                disabled={isLoading || isImporting}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Import your sleep data from Fitbit. This will import the last 30 days of sleep logs as sessions.
                Duplicate sessions will be skipped.
              </p>
              <Button
                onClick={handleImportSleepData}
                disabled={isLoading || isImporting}
                className="w-full flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Import Sleep Data
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Fitbit account to import sleep data. You'll need to authorize this app in your Fitbit account.
            </p>
            {!import.meta.env.VITE_FITBIT_CLIENT_ID && (
              <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
                Fitbit Client ID not configured. Please set VITE_FITBIT_CLIENT_ID in your .env.local file.
                See the Fitbit Developer Portal to register your app.
              </div>
            )}
            <Button
              onClick={connect}
              disabled={isLoading || !import.meta.env.VITE_FITBIT_CLIENT_ID}
              className="w-full flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? 'Connecting...' : 'Connect Fitbit'}
            </Button>
          </div>
        )}
      </div>
    </PageSection>
  );
};

