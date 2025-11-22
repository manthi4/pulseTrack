import { useState, useEffect, useCallback } from 'react';
import { 
  getActivities, 
  getSessions, 
  createSession, 
  deleteSession, 
  deleteActivity, 
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
      const acts = await getActivities();
      const sess = await getSessions();
      
      if (acts.length === 0) {
         await seedDB();
         const seededActs = await getActivities();
         const seededSess = await getSessions();
         setActivities(seededActs);
         setSessions(seededSess);
      } else {
         setActivities(acts);
         setSessions(sess);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addSession = async (session: Omit<Session, 'id'>) => {
    await createSession(session);
    await loadData();
  };

  const removeSession = async (id: number) => {
    if (confirm('Delete this session?')) {
      await deleteSession(id);
      await loadData();
    }
  };

  const removeActivity = async (id: number) => {
    if (confirm('Are you sure you want to delete this activity? Associated sessions will not be deleted but will lose this tag.')) {
      await deleteActivity(id);
      await loadData();
      return true; // success
    }
    return false;
  };

  const resetData = async () => {
    if (confirm('This will delete all data and reset to default. Continue?')) {
      await resetDB();
      await loadData();
      return true;
    }
    return false;
  };

  return {
    activities,
    sessions,
    loading,
    refreshData: loadData,
    addSession,
    removeSession,
    removeActivity,
    resetData
  };
}

