import Dexie, { type EntityTable } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import { v4 as uuidv4 } from 'uuid';

// Dexie Cloud requires string primary keys for synced tables
// We use sync_id as the primary key (string) for Dexie Cloud compatibility
export interface Activity {
  sync_id: string; // Primary key (string) for Dexie Cloud
  id?: number; // Keep for backward compatibility, but not used as primary key
  name: string;
  goal: number;
  goal_scale: 'daily' | 'weekly' | 'monthly' | 'yearly';
  color: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Session {
  sync_id: string; // Primary key (string) for Dexie Cloud
  id?: number; // Keep for backward compatibility, but not used as primary key
  name: string;
  start_time: number;
  end_time: number;
  activity_ids: string[]; // Changed to string[] to reference sync_id
  updated_at: number;
  deleted_at: number | null;
}

class PulseTrackDatabase extends Dexie {
  activities!: EntityTable<Activity, 'sync_id'>;
  sessions!: EntityTable<Session, 'sync_id'>;

  constructor() {
    super('pulsetrack-db', { addons: [dexieCloud] });
    
    // Configure Dexie Cloud
    // The database URL should be set via VITE_DEXIE_CLOUD_DB_URL in .env.local
    // Get the URL from dexie-cloud.json: dbUrl field
    const dbUrl = import.meta.env.VITE_DEXIE_CLOUD_DB_URL;
    
    if (dbUrl) {
      this.cloud.configure({
        databaseUrl: dbUrl,
        requireAuth: false, // Set to true if you want to require authentication
        // requireAuth: false allows local use without login, but sync requires authentication
      });
    } else if (import.meta.env.DEV) {
      console.warn(
        'Dexie Cloud: No database URL configured.\n' +
        'To enable sync:\n' +
        '1. Create .env.local in pulsetrack_react/\n' +
        '2. Add: VITE_DEXIE_CLOUD_DB_URL=https://your-database.dexie.cloud\n' +
        '3. Get the URL from dexie-cloud.json (dbUrl field)\n' +
        '4. Restart your dev server'
      );
    }

    // Version 1: Initial schema
    this.version(1).stores({
      activities: '++id, name, created_at',
      sessions: '++id, start_time, end_time, *activity_ids'
    });

    // Version 2: Add sync_id indexes
    this.version(2).stores({
      activities: '++id, name, created_at, sync_id',
      sessions: '++id, start_time, end_time, *activity_ids, sync_id'
    });

    // Version 3: Make sync_id unique for cloud sync
    // Note: We keep sync_id (non-unique) since IndexedDB doesn't allow changing index properties
    // The unique constraint will be enforced at the application level
    this.version(3).stores({
      activities: '++id, name, created_at, sync_id',
      sessions: '++id, start_time, end_time, *activity_ids, sync_id'
    }).upgrade(async (tx) => {
      // Migration: Ensure all existing items have sync_id
      const activities = await tx.table('activities').toCollection().toArray();
      const sessions = await tx.table('sessions').toCollection().toArray();
      
      for (const activity of activities) {
        if (!activity.sync_id) {
          await tx.table('activities').update(activity.id!, { sync_id: uuidv4() });
        }
      }
      
      for (const session of sessions) {
        if (!session.sync_id) {
          await tx.table('sessions').update(session.id!, { sync_id: uuidv4() });
        }
      }
    });

    // Version 4: Fix schema - remove duplicate sync_id index definition
    // This version fixes the issue where version 3 tried to create both sync_id and &sync_id
    this.version(4).stores({
      activities: '++id, name, created_at, sync_id',
      sessions: '++id, start_time, end_time, *activity_ids, sync_id'
    });

    // Version 5: Change primary key to sync_id (string) for Dexie Cloud compatibility
    // Dexie Cloud requires string primary keys for synced tables
    this.version(5).stores({
      activities: '&sync_id, id, name, created_at',
      sessions: '&sync_id, id, start_time, end_time, *activity_ids'
    }).upgrade(async (tx) => {
      // Migration: Convert existing data to use sync_id as primary key
      // Read old data (with numeric ids)
      const oldActivities = await tx.table('activities').toCollection().toArray();
      const oldSessions = await tx.table('sessions').toCollection().toArray();
      
      // Build mapping from old numeric id to sync_id
      const activityIdMap = new Map<number, string>();
      
      for (const activity of oldActivities) {
        let syncId = activity.sync_id;
        if (!syncId) {
          syncId = uuidv4();
        }
        if (activity.id !== undefined) {
          activityIdMap.set(activity.id, syncId);
        }
      }
      
      // Clear old tables (they will be recreated with new schema)
      await tx.table('activities').clear();
      await tx.table('sessions').clear();
      
      // Re-add activities with sync_id as primary key
      for (const activity of oldActivities) {
        let syncId = activity.sync_id;
        if (!syncId) {
          syncId = uuidv4();
        }
        await tx.table('activities').add({
          ...activity,
          sync_id: syncId,
        } as Activity);
      }
      
      // Re-add sessions with converted activity_ids (numbers -> strings)
      for (const session of oldSessions) {
        let syncId = session.sync_id;
        if (!syncId) {
          syncId = uuidv4();
        }
        // Convert activity_ids from numbers to sync_ids (strings)
        const activitySyncIds = (session.activity_ids as any as number[])
          .map(id => activityIdMap.get(id))
          .filter((id): id is string => id !== undefined);
        
        await tx.table('sessions').add({
          ...session,
          sync_id: syncId,
          activity_ids: activitySyncIds,
        } as Session);
      }
    });
  }
}

const db = new PulseTrackDatabase();

export const getDB = () => db;

// CRUD Operations

// Activities
export const createActivity = async (activity: Omit<Activity, 'sync_id' | 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
  const now = Date.now();
  const syncId = uuidv4();
  return db.activities.add({
    ...activity,
    sync_id: syncId,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }).then(() => syncId);
};

export const getActivities = async (includeDeleted = false) => {
  const activities = await db.activities.orderBy('created_at').toArray();
  if (includeDeleted) return activities;
  return activities.filter(a => a.deleted_at === null);
};

export const updateActivity = async (syncId: string, activity: Partial<Omit<Activity, 'sync_id' | 'id' | 'created_at'>>) => {
  const existing = await db.activities.get(syncId);
  if (!existing) throw new Error('Activity not found');
  return db.activities.put({
    ...existing,
    ...activity,
    updated_at: Date.now()
  });
};

export const deleteActivity = async (syncId: string) => {
  const existing = await db.activities.get(syncId);
  if (!existing) return;

  // Soft delete activity
  await db.activities.put({
    ...existing,
    deleted_at: Date.now(),
    updated_at: Date.now()
  });

  // Remove activity from sessions (Referential Integrity)
  // Find sessions with this activity using the multi-entry index
  const sessionsWithActivity = await db.sessions
    .where('activity_ids')
    .equals(syncId)
    .toArray();

  // Update each session to remove the activity sync_id
  await db.sessions.bulkPut(
    sessionsWithActivity.map(session => ({
      ...session,
      activity_ids: session.activity_ids.filter((aid) => aid !== syncId),
      updated_at: Date.now()
    }))
  );
};

// Sync helpers - allow creating/updating with all fields preserved
export const putActivityForSync = async (activity: Activity) => {
  return db.activities.put(activity);
};

export const putSessionForSync = async (session: Session) => {
  return db.sessions.put(session);
};

// Sessions
export const createSession = async (session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => {
  const syncId = uuidv4();
  return db.sessions.add({
    ...session,
    sync_id: syncId,
    updated_at: Date.now(),
    deleted_at: null,
  }).then(() => syncId);
};

export const getSessions = async (includeDeleted = false) => {
  // Sort by start_time descending
  const sessions = await db.sessions.orderBy('start_time').reverse().toArray();
  const filtered = includeDeleted ? sessions : sessions.filter(s => s.deleted_at === null);
  return filtered;
};

export const getSessionsByActivity = async (activitySyncId: string) => {
  const sessions = await db.sessions
    .where('activity_ids')
    .equals(activitySyncId)
    .toArray();
  return sessions
    .filter(s => s.deleted_at === null)
    .sort((a, b) => b.start_time - a.start_time);
}

export const updateSession = async (syncId: string, session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => {
  const existing = await db.sessions.get(syncId);
  if (!existing) throw new Error('Session not found');
  return db.sessions.put({
    ...existing,
    ...session,
    sync_id: syncId,
    updated_at: Date.now()
  });
};

export const deleteSession = async (syncId: string) => {
  const existing = await db.sessions.get(syncId);
  if (!existing) return;

  return db.sessions.put({
    ...existing,
    deleted_at: Date.now(),
    updated_at: Date.now()
  });
};

// Seeding and Reset
export const seedDB = async () => {
  const activityCount = await db.activities.count();
  if (activityCount > 0) return; // Already seeded

  const now = Date.now();

  // Default Activities - create with sync_id as primary key
  // Use put instead of add to ensure sync_id is set correctly for Dexie Cloud
  const sleepSyncId = uuidv4();
  const sleepActivity: Activity = { 
    name: 'Sleep', 
    goal: 8, 
    goal_scale: 'daily', 
    color: '#3b82f6', 
    created_at: now, 
    updated_at: now, 
    sync_id: sleepSyncId, 
    deleted_at: null 
  };
  await db.activities.put(sleepActivity);
  
  const gymSyncId = uuidv4();
  const gymActivity: Activity = { 
    name: 'Gym', 
    goal: 1, 
    goal_scale: 'daily', 
    color: '#6b7280', 
    created_at: now, 
    updated_at: now, 
    sync_id: gymSyncId, 
    deleted_at: null 
  };
  await db.activities.put(gymActivity);
  
  const socialSyncId = uuidv4();
  const socialActivity: Activity = { 
    name: 'Socializing', 
    goal: 10, 
    goal_scale: 'weekly', 
    color: '#eab308', 
    created_at: now, 
    updated_at: now, 
    sync_id: socialSyncId, 
    deleted_at: null 
  };
  await db.activities.put(socialActivity);

  const oneHour = 3600 * 1000;
  const today = new Date(now);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Helper to create session data - activityIds are now strings (sync_ids)
  const createSessionData = (
    dayOffset: number,
    hour: number,
    minute: number,
    duration: number,
    name: string,
    activitySyncIds: string[]
  ) => ({ dayOffset, hour, minute, duration, name, activitySyncIds });

  // Mock data for a full month (30 days) - using sync_ids (strings)
  const mockSessions = [
    // Day 0 (Today)
    createSessionData(0, 23, 30, 6.5, "Last Night's Rest", [sleepSyncId]),

    // Day 1
    createSessionData(1, 23, 15, 7, "Night's Rest", [sleepSyncId]),
    createSessionData(1, 18, 0, 1.5, "Evening Workout with Dave", [gymSyncId, socialSyncId]),

    // Day 2
    createSessionData(2, 22, 45, 6, "Night's Rest", [sleepSyncId]),
    createSessionData(2, 7, 0, 1.25, "Morning Gym Session", [gymSyncId]),

    // Day 3
    createSessionData(3, 23, 0, 7.5, "Night's Rest", [sleepSyncId]),

    // Day 4
    createSessionData(4, 22, 30, 5.5, "Night's Rest", [sleepSyncId]),
    createSessionData(4, 17, 30, 1.75, "Evening Gym Session", [gymSyncId]),

    // Day 5
    createSessionData(5, 23, 45, 6.75, "Night's Rest", [sleepSyncId]),
    createSessionData(5, 11, 0, 2.5, "Brunch with Friends", [socialSyncId]),

    // Day 6 (Weekend)
    createSessionData(6, 23, 0, 7, "Night's Rest", [sleepSyncId]),
    createSessionData(6, 8, 0, 1.5, "Morning Workout with Sarah", [gymSyncId, socialSyncId]),
    createSessionData(6, 19, 30, 3, "Dinner Out", [socialSyncId]),

    // Day 7
    createSessionData(7, 22, 15, 6.25, "Night's Rest", [sleepSyncId]),

    // Day 8
    createSessionData(8, 23, 0, 7.5, "Night's Rest", [sleepSyncId]),
    createSessionData(8, 18, 15, 1.5, "Evening Gym Session", [gymSyncId]),

    // Day 9
    createSessionData(9, 22, 45, 5.75, "Night's Rest", [sleepSyncId]),
    createSessionData(9, 6, 30, 1.25, "Morning Gym Session", [gymSyncId]),

    // Day 10
    createSessionData(10, 23, 30, 6.5, "Night's Rest", [sleepSyncId]),

    // Day 11
    createSessionData(11, 22, 0, 7, "Night's Rest", [sleepSyncId]),
    createSessionData(11, 17, 45, 1.75, "Evening Workout with Mike", [gymSyncId, socialSyncId]),

    // Day 12
    createSessionData(12, 23, 15, 6.25, "Night's Rest", [sleepSyncId]),

    // Day 13 (Weekend)
    createSessionData(13, 23, 45, 7.5, "Night's Rest", [sleepSyncId]),
    createSessionData(13, 10, 30, 2, "Coffee Meetup", [socialSyncId]),
    createSessionData(13, 16, 0, 2.5, "Hanging Out", [socialSyncId]),

    // Day 14
    createSessionData(14, 22, 30, 6, "Night's Rest", [sleepSyncId]),
    createSessionData(14, 7, 15, 1.5, "Morning Workout with Emma", [gymSyncId, socialSyncId]),

    // Day 15
    createSessionData(15, 23, 0, 7.25, "Night's Rest", [sleepSyncId]),

    // Day 16
    createSessionData(16, 22, 45, 5.5, "Night's Rest", [sleepSyncId]),
    createSessionData(16, 18, 30, 1.5, "Evening Gym Session", [gymSyncId]),

    // Day 17
    createSessionData(17, 23, 30, 6.75, "Night's Rest", [sleepSyncId]),
    createSessionData(17, 6, 45, 1.25, "Morning Gym Session", [gymSyncId]),

    // Day 18
    createSessionData(18, 22, 15, 7, "Night's Rest", [sleepSyncId]),

    // Day 19
    createSessionData(19, 23, 0, 6.5, "Night's Rest", [sleepSyncId]),
    createSessionData(19, 17, 0, 1.75, "Evening Gym Session", [gymSyncId]),

    // Day 20 (Weekend)
    createSessionData(20, 23, 45, 7.5, "Night's Rest", [sleepSyncId]),
    createSessionData(20, 9, 0, 1.5, "Morning Workout with Alex", [gymSyncId, socialSyncId]),
    createSessionData(20, 20, 0, 3.5, "Movie Night", [socialSyncId]),

    // Day 21
    createSessionData(21, 22, 30, 6.25, "Night's Rest", [sleepSyncId]),

    // Day 22
    createSessionData(22, 23, 15, 5.75, "Night's Rest", [sleepSyncId]),
    createSessionData(22, 18, 0, 1.5, "Evening Gym Session", [gymSyncId]),

    // Day 23
    createSessionData(23, 22, 45, 7, "Night's Rest", [sleepSyncId]),
    createSessionData(23, 7, 30, 1.25, "Morning Gym Session", [gymSyncId]),

    // Day 24
    createSessionData(24, 23, 0, 6.5, "Night's Rest", [sleepSyncId]),

    // Day 25
    createSessionData(25, 22, 15, 7.25, "Night's Rest", [sleepSyncId]),
    createSessionData(25, 17, 30, 1.75, "Evening Workout with Jordan", [gymSyncId, socialSyncId]),

    // Day 26 (Weekend)
    createSessionData(26, 23, 30, 6, "Night's Rest", [sleepSyncId]),
    createSessionData(26, 11, 30, 2.5, "Brunch with Friends", [socialSyncId]),
    createSessionData(26, 15, 30, 3, "Hanging Out", [socialSyncId]),

    // Day 27
    createSessionData(27, 22, 45, 7, "Night's Rest", [sleepSyncId]),
    createSessionData(27, 6, 15, 1.5, "Morning Workout with Dave", [gymSyncId, socialSyncId]),

    // Day 28
    createSessionData(28, 23, 0, 6.25, "Night's Rest", [sleepSyncId]),

    // Day 29
    createSessionData(29, 22, 30, 5.5, "Night's Rest", [sleepSyncId]),
    createSessionData(29, 18, 45, 1.5, "Evening Gym Session", [gymSyncId]),
  ];

  // Add all sessions to database - use put to ensure sync_id is set correctly
  for (const session of mockSessions) {
    const sessionDate = new Date(currentYear, currentMonth - 1, currentDay - session.dayOffset, session.hour, session.minute);
    const startTime = sessionDate.getTime();
    const endTime = startTime + (session.duration * oneHour);

    const sessionData: Session = {
      name: session.name,
      start_time: startTime,
      end_time: endTime,
      activity_ids: session.activitySyncIds,
      sync_id: uuidv4(),
      updated_at: now,
      deleted_at: null,
    };
    await db.sessions.put(sessionData);
  }
};

export const resetDB = async () => {
  await db.sessions.clear();
  await db.activities.clear();
  await seedDB();
};

export const clearAllData = async () => {
  await db.sessions.clear();
  await db.activities.clear();
};
