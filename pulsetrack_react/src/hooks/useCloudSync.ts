import { useState } from 'react';
import { getDB } from '../lib/db';
import { useObservable } from 'dexie-react-hooks';

export function useCloudSync() {
  const db = getDB();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if cloud is configured
  // Check if cloud addon is available and database URL is configured
  const envDbUrl = import.meta.env.VITE_DEXIE_CLOUD_DB_URL;
  const cloudDbUrl = db.cloud?.databaseUrl;
  const isConfigured = !!(db.cloud && (envDbUrl || cloudDbUrl));
  
  // Debug logging (only in development)
  if (import.meta.env.DEV && !isConfigured) {
    console.debug('Dexie Cloud not configured:', {
      hasCloud: !!db.cloud,
      envDbUrl: envDbUrl ? 'set' : 'not set',
      cloudDbUrl: cloudDbUrl ? 'set' : 'not set'
    });
  }

  // Get current user and sync status using observables
  // These will be null/undefined if not configured or not logged in
  // useObservable must be called unconditionally (React hooks rule)
  // Using optional chaining to safely access cloud properties
  const rawCurrentUser = useObservable(db.cloud?.currentUser);
  const syncStatus = useObservable(db.cloud?.syncState);
  
  // Filter out "unauthorized" or invalid user states
  // If user name is "unauthorized", treat as not logged in
  const currentUser = rawCurrentUser && 
    rawCurrentUser.name && 
    rawCurrentUser.name.toLowerCase().includes('unauthorized') 
      ? null 
      : rawCurrentUser;

  const login = async () => {
    if (!isConfigured) {
      setError('Cloud sync is not configured');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await db.cloud.login();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!isConfigured) {
      setError('Cloud sync is not configured');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      console.log('Logging out...', { currentUser: rawCurrentUser });
      
      // Try normal logout first
      try {
        await db.cloud.logout();
        console.log('Logout successful');
      } catch (logoutErr) {
        console.warn('Standard logout failed, trying alternative methods:', logoutErr);
        
        // If standard logout fails, try alternative methods
        // Clear any stored tokens or auth state
        if (db.cloud) {
          // Try to clear tokens if the API exists
          const cloudAny = db.cloud as any;
          if (typeof cloudAny.revokeToken === 'function') {
            await cloudAny.revokeToken();
          }
          if (typeof cloudAny.clearTokens === 'function') {
            await cloudAny.clearTokens();
          }
        }
      }
      
      // Force a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify logout worked
      const userAfterLogout = db.cloud?.currentUser?.value;
      if (userAfterLogout) {
        console.warn('User still logged in after logout attempt:', userAfterLogout);
        // Force clear by setting error state
        setError('Logout completed, but please refresh the page if you still see logged in status');
      }
    } catch (err) {
      console.error('Logout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sync = async () => {
    if (!isConfigured) {
      setError('Cloud sync is not configured');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to sync');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await db.cloud.sync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentUser,
    syncStatus,
    isLoading,
    error,
    login,
    logout,
    sync,
    isConfigured,
  };
}

