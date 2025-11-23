import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Activity {
  id?: number;
  name: string;
  goal: number;
  goal_scale: 'daily' | 'weekly' | 'monthly' | 'yearly';
  color: string;
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

export const updateActivity = async (id: number, activity: Partial<Omit<Activity, 'id' | 'created_at'>>) => {
  const db = await getDB();
  const existing = await db.get('activities', id);
  if (!existing) throw new Error('Activity not found');
  return db.put('activities', { ...existing, ...activity });
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

export const updateSession = async (id: number, session: Omit<Session, 'id'>) => {
  const db = await getDB();
  return db.put('sessions', { ...session, id });
};

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
  const sleepId = await db.add('activities', { name: 'Sleep', goal: 8, goal_scale: 'daily', color: '#3b82f6', created_at: Date.now() });
  const gymId = await db.add('activities', { name: 'Gym', goal: 1, goal_scale: 'daily', color: '#6b7280', created_at: Date.now() });
  const socialId = await db.add('activities', { name: 'Socializing', goal: 10, goal_scale: 'weekly', color: '#eab308', created_at: Date.now() });

  const oneHour = 3600 * 1000;
  const now = Date.now();
  const today = new Date(now);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Helper to create session data
  const createSessionData = (
    dayOffset: number,
    hour: number,
    minute: number,
    duration: number,
    name: string,
    activityIds: number[]
  ) => ({ dayOffset, hour, minute, duration, name, activityIds });

  // Mock data for a full month (30 days)
  const mockSessions = [
    // Day 0 (Today)
    createSessionData(0, 23, 30, 6.5, "Last Night's Rest", [sleepId as number]),
    
    // Day 1
    createSessionData(1, 23, 15, 7, "Night's Rest", [sleepId as number]),
    createSessionData(1, 18, 0, 1.5, "Evening Workout with Dave", [gymId as number, socialId as number]),
    
    // Day 2
    createSessionData(2, 22, 45, 6, "Night's Rest", [sleepId as number]),
    createSessionData(2, 7, 0, 1.25, "Morning Gym Session", [gymId as number]),
    
    // Day 3
    createSessionData(3, 23, 0, 7.5, "Night's Rest", [sleepId as number]),
    
    // Day 4
    createSessionData(4, 22, 30, 5.5, "Night's Rest", [sleepId as number]),
    createSessionData(4, 17, 30, 1.75, "Evening Gym Session", [gymId as number]),
    
    // Day 5
    createSessionData(5, 23, 45, 6.75, "Night's Rest", [sleepId as number]),
    createSessionData(5, 11, 0, 2.5, "Brunch with Friends", [socialId as number]),
    
    // Day 6 (Weekend)
    createSessionData(6, 23, 0, 7, "Night's Rest", [sleepId as number]),
    createSessionData(6, 8, 0, 1.5, "Morning Workout with Sarah", [gymId as number, socialId as number]),
    createSessionData(6, 19, 30, 3, "Dinner Out", [socialId as number]),
    
    // Day 7
    createSessionData(7, 22, 15, 6.25, "Night's Rest", [sleepId as number]),
    
    // Day 8
    createSessionData(8, 23, 0, 7.5, "Night's Rest", [sleepId as number]),
    createSessionData(8, 18, 15, 1.5, "Evening Gym Session", [gymId as number]),
    
    // Day 9
    createSessionData(9, 22, 45, 5.75, "Night's Rest", [sleepId as number]),
    createSessionData(9, 6, 30, 1.25, "Morning Gym Session", [gymId as number]),
    
    // Day 10
    createSessionData(10, 23, 30, 6.5, "Night's Rest", [sleepId as number]),
    
    // Day 11
    createSessionData(11, 22, 0, 7, "Night's Rest", [sleepId as number]),
    createSessionData(11, 17, 45, 1.75, "Evening Workout with Mike", [gymId as number, socialId as number]),
    
    // Day 12
    createSessionData(12, 23, 15, 6.25, "Night's Rest", [sleepId as number]),
    
    // Day 13 (Weekend)
    createSessionData(13, 23, 45, 7.5, "Night's Rest", [sleepId as number]),
    createSessionData(13, 10, 30, 2, "Coffee Meetup", [socialId as number]),
    createSessionData(13, 16, 0, 2.5, "Hanging Out", [socialId as number]),
    
    // Day 14
    createSessionData(14, 22, 30, 6, "Night's Rest", [sleepId as number]),
    createSessionData(14, 7, 15, 1.5, "Morning Workout with Emma", [gymId as number, socialId as number]),
    
    // Day 15
    createSessionData(15, 23, 0, 7.25, "Night's Rest", [sleepId as number]),
    
    // Day 16
    createSessionData(16, 22, 45, 5.5, "Night's Rest", [sleepId as number]),
    createSessionData(16, 18, 30, 1.5, "Evening Gym Session", [gymId as number]),
    
    // Day 17
    createSessionData(17, 23, 30, 6.75, "Night's Rest", [sleepId as number]),
    createSessionData(17, 6, 45, 1.25, "Morning Gym Session", [gymId as number]),
    
    // Day 18
    createSessionData(18, 22, 15, 7, "Night's Rest", [sleepId as number]),
    
    // Day 19
    createSessionData(19, 23, 0, 6.5, "Night's Rest", [sleepId as number]),
    createSessionData(19, 17, 0, 1.75, "Evening Gym Session", [gymId as number]),
    
    // Day 20 (Weekend)
    createSessionData(20, 23, 45, 7.5, "Night's Rest", [sleepId as number]),
    createSessionData(20, 9, 0, 1.5, "Morning Workout with Alex", [gymId as number, socialId as number]),
    createSessionData(20, 20, 0, 3.5, "Movie Night", [socialId as number]),
    
    // Day 21
    createSessionData(21, 22, 30, 6.25, "Night's Rest", [sleepId as number]),
    
    // Day 22
    createSessionData(22, 23, 15, 5.75, "Night's Rest", [sleepId as number]),
    createSessionData(22, 18, 0, 1.5, "Evening Gym Session", [gymId as number]),
    
    // Day 23
    createSessionData(23, 22, 45, 7, "Night's Rest", [sleepId as number]),
    createSessionData(23, 7, 30, 1.25, "Morning Gym Session", [gymId as number]),
    
    // Day 24
    createSessionData(24, 23, 0, 6.5, "Night's Rest", [sleepId as number]),
    
    // Day 25
    createSessionData(25, 22, 15, 7.25, "Night's Rest", [sleepId as number]),
    createSessionData(25, 17, 30, 1.75, "Evening Workout with Jordan", [gymId as number, socialId as number]),
    
    // Day 26 (Weekend)
    createSessionData(26, 23, 30, 6, "Night's Rest", [sleepId as number]),
    createSessionData(26, 11, 30, 2.5, "Brunch with Friends", [socialId as number]),
    createSessionData(26, 15, 30, 3, "Hanging Out", [socialId as number]),
    
    // Day 27
    createSessionData(27, 22, 45, 7, "Night's Rest", [sleepId as number]),
    createSessionData(27, 6, 15, 1.5, "Morning Workout with Dave", [gymId as number, socialId as number]),
    
    // Day 28
    createSessionData(28, 23, 0, 6.25, "Night's Rest", [sleepId as number]),
    
    // Day 29
    createSessionData(29, 22, 30, 5.5, "Night's Rest", [sleepId as number]),
    createSessionData(29, 18, 45, 1.5, "Evening Gym Session", [gymId as number]),
  ];

  // Add all sessions to database
  for (const session of mockSessions) {
    const sessionDate = new Date(currentYear, currentMonth - 1, currentDay - session.dayOffset, session.hour, session.minute);
    const startTime = sessionDate.getTime();
    const endTime = startTime + (session.duration * oneHour);
    
    await db.add('sessions', {
      name: session.name,
      start_time: startTime,
      end_time: endTime,
      activity_ids: session.activityIds,
    });
  }
};

export const resetDB = async () => {
  const db = await getDB();
  const tx = db.transaction(['sessions', 'activities'], 'readwrite');
  await tx.objectStore('sessions').clear();
  await tx.objectStore('activities').clear();
  await tx.done;
  await seedDB();
};
