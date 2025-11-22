import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Activity {
  id?: number;
  name: string;
  goal: number;
  goal_scale: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: number;
}

export interface Session {
  id?: number;
  name: string;
  start_time: number;
  end_time: number;
  activity_ids: number[];
}

export interface PulseTrackDB extends DBSchema {
  activities: {
    key: number;
    value: Activity;
    indexes: { 'by-name': string; 'by-created_at': number };
  };
  sessions: {
    key: number;
    value: Session;
    indexes: { 'by-start_time': number; 'by-end_time': number; 'by-activity_ids': number };
  };
}

const DB_NAME = 'pulsetrack-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PulseTrackDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PulseTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const activityStore = db.createObjectStore('activities', {
          keyPath: 'id',
          autoIncrement: true,
        });
        activityStore.createIndex('by-name', 'name');
        activityStore.createIndex('by-created_at', 'created_at');

        const sessionStore = db.createObjectStore('sessions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        sessionStore.createIndex('by-start_time', 'start_time');
        sessionStore.createIndex('by-end_time', 'end_time');
        sessionStore.createIndex('by-activity_ids', 'activity_ids', { multiEntry: true });
      },
    });
  }
  return dbPromise;
};

// CRUD Operations

// Activities
export const createActivity = async (activity: Omit<Activity, 'id' | 'created_at'>) => {
  const db = await getDB();
  return db.add('activities', {
    ...activity,
    created_at: Date.now(),
  });
};

export const getActivities = async () => {
  const db = await getDB();
  return db.getAllFromIndex('activities', 'by-created_at');
};

export const deleteActivity = async (id: number) => {
  const db = await getDB();
  // Remove activity from sessions first (Referential Integrity)
  const tx = db.transaction(['sessions', 'activities'], 'readwrite');
  const sessionStore = tx.objectStore('sessions');
  const activityStore = tx.objectStore('activities');

  // Find sessions with this activity
  // Since we have a multiEntry index on activity_ids, we can query it
  const sessionsWithActivity = await sessionStore.index('by-activity_ids').getAllKeys(id);

  for (const sessionId of sessionsWithActivity) {
    const session = await sessionStore.get(sessionId);
    if (session) {
      session.activity_ids = session.activity_ids.filter((aid) => aid !== id);
      await sessionStore.put(session);
    }
  }

  await activityStore.delete(id);
  await tx.done;
};

// Sessions
export const createSession = async (session: Omit<Session, 'id'>) => {
  const db = await getDB();
  return db.add('sessions', session);
};

export const getSessions = async () => {
  const db = await getDB();
  // Sort by start_time descending
  const sessions = await db.getAllFromIndex('sessions', 'by-start_time');
  return sessions.reverse();
};

export const getSessionsByActivity = async (activityId: number) => {
    const db = await getDB();
    const sessions = await db.getAllFromIndex('sessions', 'by-activity_ids', activityId);
    return sessions.sort((a, b) => b.start_time - a.start_time);
}

export const deleteSession = async (id: number) => {
  const db = await getDB();
  return db.delete('sessions', id);
};

// Seeding and Reset
export const seedDB = async () => {
  const db = await getDB();
  const activityCount = await db.count('activities');
  if (activityCount > 0) return; // Already seeded

  // Default Activities
  const sleepId = await db.add('activities', { name: 'Sleep', goal: 8, goal_scale: 'daily', created_at: Date.now() });
  const gymId = await db.add('activities', { name: 'Gym', goal: 1, goal_scale: 'daily', created_at: Date.now() });
  const socialId = await db.add('activities', { name: 'Socializing', goal: 10, goal_scale: 'weekly', created_at: Date.now() });

  // Default Sessions
  // "Night's Rest" (8h) - yesterday night to this morning
  const now = Date.now();
  const oneHour = 3600 * 1000;
  
  await db.add('sessions', {
    name: "Night's Rest",
    start_time: now - (8 * oneHour),
    end_time: now,
    activity_ids: [sleepId as number],
  });

  // "Evening Workout with Dave" (1.5h) - 2 days ago
  await db.add('sessions', {
    name: "Evening Workout with Dave",
    start_time: now - (48 * oneHour),
    end_time: now - (46.5 * oneHour),
    activity_ids: [gymId as number, socialId as number],
  });
};

export const resetDB = async () => {
  const db = await getDB();
  const tx = db.transaction(['sessions', 'activities'], 'readwrite');
  await tx.objectStore('sessions').clear();
  await tx.objectStore('activities').clear();
  await tx.done;
  await seedDB();
};

