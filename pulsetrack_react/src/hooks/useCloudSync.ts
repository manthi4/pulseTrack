import { useState, useCallback, useEffect } from 'react';
import { getDB } from '../lib/db';
import { useObservable } from 'dexie-react-hooks';
import { isAuthenticated } from '../lib/authUtils';

/**
 * Hook for managing Dexie Cloud sync and authentication
 */
export function useCloudSync() {
  const db = getDB();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if cloud is configured
  const envDbUrl = import.meta.env.VITE_DEXIE_CLOUD_DB_URL;
  const isConfigured = !!(db.cloud && envDbUrl);
  
  // Debug logging (only in development)
  if (import.meta.env.DEV && !isConfigured) {
    console.debug('Dexie Cloud not configured:', {
      hasCloud: !!db.cloud,
      envDbUrl: envDbUrl ? 'set' : 'not set'
    });
  }

  // Debug sync state changes (only in development)
  useEffect(() => {
    if (import.meta.env.DEV && db.cloud?.syncState) {
      console.log('🔍 Setting up sync state observer');
      const subscription = db.cloud.syncState.subscribe((state) => {
        console.log('📡 Dexie Cloud sync state changed:', state);
      });
      
      // Log initial state
      console.log('📡 Initial sync state:', db.cloud.syncState.value);
      
      return () => {
        console.log('🔍 Cleaning up sync state observer');
        subscription.unsubscribe();
      };
    }
  }, []);

  // Get current user and sync status using observables
  const rawCurrentUser = useObservable(db.cloud?.currentUser);
  const syncStatus = useObservable(db.cloud?.syncState);
  
  // Filter out unauthorized user states
  const currentUser = isAuthenticated(rawCurrentUser) ? rawCurrentUser : null;

  // Auto-trigger sync when user logs in (if not already syncing)
  useEffect(() => {
    if (currentUser && isConfigured && db.cloud) {
      const syncStateValue = db.cloud.syncState?.value;
      const isIdle = !syncStateValue || 
        (syncStateValue as any).status === 'pending' || 
        (syncStateValue as any).status === undefined;
      
      // Only auto-sync if we're idle/pending and not currently loading
      if (isIdle && !isLoading) {
        // Small delay to ensure user state is fully propagated
        const timeoutId = setTimeout(async () => {
          try {
            await db.cloud!.sync();
          } catch (err) {
            // Silently fail - user can manually sync if needed
            console.debug('Auto-sync after login failed:', err);
          }
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentUser, isConfigured, isLoading]);

  // Wrapper for async operations with loading and error handling
  const withAsyncHandler = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T | void> => {
    if (!isConfigured) {
      setError('Cloud sync is not configured');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      return await operation();
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  const login = useCallback(async () => {
    await withAsyncHandler(async () => {
      await db.cloud!.login();
      // Trigger initial sync after successful login
      // Small delay to ensure login state is fully propagated
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        await db.cloud!.sync();
      } catch (syncErr) {
        console.warn('Initial sync after login failed (this is usually OK):', syncErr);
        // Don't throw - login was successful, sync can happen later
      }
    }, 'Failed to login');
  }, [withAsyncHandler]);

  const logout = useCallback(async () => {
    await withAsyncHandler(async () => {
      try {
        await db.cloud!.logout();
      } catch (logoutErr) {
        console.warn('Standard logout failed, trying alternative methods:', logoutErr);
        
        // Try alternative logout methods
        const cloudAny = db.cloud as any;
        if (typeof cloudAny.revokeToken === 'function') {
          await cloudAny.revokeToken();
        }
        if (typeof cloudAny.clearTokens === 'function') {
          await cloudAny.clearTokens();
        }
      }
      
      // Small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify logout worked
      const userAfterLogout = db.cloud?.currentUser?.value;
      if (userAfterLogout) {
        console.warn('User still logged in after logout attempt:', userAfterLogout);
        setError('Logout completed, but please refresh the page if you still see logged in status');
      }
    }, 'Failed to logout');
  }, [withAsyncHandler]);

  const sync = useCallback(async () => {
    if (!currentUser) {
      setError('You must be logged in to sync');
      return;
    }
    
    if (!isConfigured) {
      setError('Cloud sync is not configured');
      return;
    }
    
    if (!db.cloud) {
      setError('Cloud sync is not available');
      return;
    }
    
    try {
      setIsSyncing(true);
      setError(null);
      
      console.log('🔄 Starting sync...', {
        currentUser,
        syncStateBefore: db.cloud.syncState?.value,
        hasCloud: !!db.cloud
      });
      
      await db.cloud.sync();
      
      console.log('✅ Sync call completed', {
        syncStateAfter: db.cloud.syncState?.value
      });
      
      // Wait a bit for sync state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📊 Final sync state:', db.cloud.syncState?.value);
    } catch (syncErr) {
      console.error('❌ Sync error:', syncErr);
      setError(syncErr instanceof Error ? syncErr.message : 'Failed to sync');
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, isConfigured]);

  return {
    currentUser,
    syncStatus,
    isLoading,
    isSyncing,
    error,
    login,
    logout,
    sync,
    isConfigured,
  };
}

