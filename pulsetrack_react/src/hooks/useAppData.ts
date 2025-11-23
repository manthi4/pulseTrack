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
      
      if (acts.length === 0) {
        await seedDB();
        acts = await getActivities();
        sess = await getSessions();
      }
      
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

  const addSession = useCallback((session: Omit<Session, 'id'>) => 
    withReload(() => createSession(session)), [withReload]);

  const editSession = useCallback((id: number, session: Omit<Session, 'id'>) => 
    withReload(() => updateSession(id, session)), [withReload]);

  const removeSession = useCallback(async (id: number) => {
    await withReload(() => deleteSession(id));
  }, [withReload]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'created_at'>) => 
    withReload(() => createActivity(activity)), [withReload]);

  const editActivity = useCallback((id: number, activity: Partial<Omit<Activity, 'id' | 'created_at'>>) => 
    withReload(() => updateActivity(id, activity)), [withReload]);

  const removeActivity = useCallback(async (id: number) => {
    if (confirm('Are you sure you want to delete this activity? Associated sessions will not be deleted but will lose this tag.')) {
      await withReload(() => deleteActivity(id));
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

  return {
    activities,
    sessions,
    loading,
    refreshData: loadData,
    addSession,
    editSession,
    removeSession,
    addActivity,
    editActivity,
    removeActivity,
    resetData
  };
}
