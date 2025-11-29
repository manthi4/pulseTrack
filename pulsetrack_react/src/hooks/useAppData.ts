import { useState, useEffect, useCallback } from 'react';
import { 
  getActivities, 
  getSessions, 
  createSession, 
  updateSession,
  deleteSession, 
  createActivity,
  deleteActivity,
  updateActivity,
  seedDB, 
  resetDB,
  type Activity, 
  type Session 
} from '../lib/db';

export function useAppData() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let acts = await getActivities();
      let sess = await getSessions();
      
      setActivities(acts);
      setSessions(sess);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to execute DB operation and reload data
  const withReload = useCallback(async <T,>(operation: () => Promise<T>) => {
    await operation();
    await loadData();
  }, [loadData]);

  const addSession = useCallback((session: Omit<Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'>) => 
    withReload(() => createSession(session)), [withReload]);

  const editSession = useCallback((syncId: string, session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => 
    withReload(() => updateSession(syncId, session)), [withReload]);

  const removeSession = useCallback(async (syncId: string) => {
    await withReload(() => deleteSession(syncId));
  }, [withReload]);

  const addActivity = useCallback((activity: Omit<Activity, 'sync_id' | 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => 
    withReload(() => createActivity(activity)), [withReload]);

  const editActivity = useCallback((syncId: string, activity: Partial<Omit<Activity, 'sync_id' | 'id' | 'created_at'>>) => 
    withReload(() => updateActivity(syncId, activity)), [withReload]);

  const removeActivity = useCallback(async (syncId: string) => {
    if (confirm('Are you sure you want to delete this activity? Associated sessions will not be deleted but will lose this tag.')) {
      await withReload(() => deleteActivity(syncId));
      return true;
    }
    return false;
  }, [withReload]);

  const resetData = useCallback(async () => {
    if (confirm('This will delete all data and reset to default. Continue?')) {
      await withReload(() => resetDB());
      return true;
    }
    return false;
  }, [withReload]);

  const refreshData = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  const refreshDataWithoutSeed = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return {
    activities,
    sessions,
    loading,
    refreshData,
    refreshDataWithoutSeed,
    addSession,
    editSession,
    removeSession,
    addActivity,
    editActivity,
    removeActivity,
    resetData
  };
}
