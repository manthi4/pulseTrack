import { useState, useEffect } from 'react';
import { getDB } from '../lib/db';
import { useObservable } from 'dexie-react-hooks';

export function useCloudSync() {
  const db = getDB();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user and sync status using observables
  const currentUser = useObservable(db.cloud.currentUser);
  const syncStatus = useObservable(db.cloud.syncState);

  const login = async () => {
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
    try {
      setIsLoading(true);
      setError(null);
      await db.cloud.logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const sync = async () => {
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
    isConfigured: !!db.cloud.databaseUrl,
  };
}

