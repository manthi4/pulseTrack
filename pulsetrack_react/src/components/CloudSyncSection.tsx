import React from 'react';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { useCloudSync } from '../hooks/useCloudSync';
import { formatUserDisplay, getSyncStatusText, getSyncStatusBadgeClasses, type SyncStatus } from '../lib/authUtils';
import { cn } from '../lib/utils';
import { PageSection } from './ui/PageSection';

export const CloudSyncSection: React.FC = () => {
  const { currentUser, syncStatus, isLoading, isSyncing, error, login, logout, sync, isConfigured } = useCloudSync();

  if (!isConfigured) {
    return null;
  }

  return (
    <PageSection
      icon={currentUser ? Cloud : CloudOff}
      title="Cloud Sync"
      description="Sync your data across devices with Dexie Cloud"
      iconBgColor={currentUser ? 'primary' : 'muted'}
    >

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
                  {formatUserDisplay(currentUser)}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                disabled={isLoading || isSyncing}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {isLoading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Sync Status</span>
                <span className={cn("text-xs px-2 py-1 rounded", getSyncStatusBadgeClasses(syncStatus as SyncStatus))}>
                  {getSyncStatusText(syncStatus as SyncStatus)}
                </span>
              </div>
              {syncStatus && (syncStatus as SyncStatus).lastSync && (
                <p className="text-xs text-muted-foreground">
                  Last sync: {new Date((syncStatus as SyncStatus).lastSync!).toLocaleString()}
                </p>
              )}
              {!syncStatus && (
                <p className="text-xs text-muted-foreground">
                  Click "Sync Now" to start syncing your data
                </p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={sync}
              disabled={isLoading || isSyncing}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your data is stored locally and works offline. Log in to enable cloud sync and access your data across all your devices.
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
    </PageSection>
  );
};

