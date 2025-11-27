import Dexie, { type EntityTable } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

export interface Activity {
  id?: number;
  sync_id: string;
  name: string;
  goal: number;
  goal_scale: 'daily' | 'weekly' | 'monthly' | 'yearly';
  color: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Session {
  id?: number;
  sync_id: string;
  name: string;
  start_time: number;
  end_time: number;
  activity_ids: number[];
  updated_at: number;
  deleted_at: number | null;
}

class PulseTrackDatabase extends Dexie {
  activities!: EntityTable<Activity, 'id'>;
  sessions!: EntityTable<Session, 'id'>;

  constructor() {
    super('pulsetrack-db');
    
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
  }
}

const db = new PulseTrackDatabase();

export const getDB = () => db;

// CRUD Operations

// Activities
export const createActivity = async (activity: Omit<Activity, 'id' | 'created_at' | 'sync_id' | 'updated_at' | 'deleted_at'>) => {
  const now = Date.now();
  return db.activities.add({
    ...activity,
    sync_id: uuidv4(),
    created_at: now,
    updated_at: now,
    deleted_at: null,
  });
};

export const getActivities = async (includeDeleted = false) => {
  const activities = await db.activities.orderBy('created_at').toArray();
  if (includeDeleted) return activities;
  return activities.filter(a => a.deleted_at === null);
};

export const updateActivity = async (id: number, activity: Partial<Omit<Activity, 'id' | 'created_at'>>) => {
  const existing = await db.activities.get(id);
  if (!existing) throw new Error('Activity not found');
  return db.activities.put({
    ...existing,
    ...activity,
    updated_at: Date.now()
  });
};

export const deleteActivity = async (id: number) => {
  const existing = await db.activities.get(id);
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
    .equals(id)
    .toArray();

  // Update each session to remove the activity ID
  await db.sessions.bulkPut(
    sessionsWithActivity.map(session => ({
      ...session,
      activity_ids: session.activity_ids.filter((aid) => aid !== id),
      updated_at: Date.now()
    }))
  );
};

// Sync helpers - allow creating/updating with all fields preserved
export const putActivityForSync = async (activity: Omit<Activity, 'id'>) => {
  // Check if activity with this sync_id already exists
  const existing = await db.activities.where('sync_id').equals(activity.sync_id).first();
  if (existing) {
    return db.activities.put({
      ...existing,
      ...activity,
      id: existing.id
    });
  } else {
    return db.activities.add(activity as Activity);
  }
};

export const putSessionForSync = async (session: Omit<Session, 'id'>) => {
  // Check if session with this sync_id already exists
  const existing = await db.sessions.where('sync_id').equals(session.sync_id).first();
  if (existing) {
    return db.sessions.put({
      ...existing,
      ...session,
      id: existing.id
    });
  } else {
    return db.sessions.add(session as Session);
  }
};

// Sessions
export const createSession = async (session: Omit<Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'>) => {
  return db.sessions.add({
    ...session,
    sync_id: uuidv4(),
    updated_at: Date.now(),
    deleted_at: null,
  });
};

export const getSessions = async (includeDeleted = false) => {
  // Sort by start_time descending
  const sessions = await db.sessions.orderBy('start_time').reverse().toArray();
  const filtered = includeDeleted ? sessions : sessions.filter(s => s.deleted_at === null);
  return filtered;
};

export const getSessionsByActivity = async (activityId: number) => {
  const sessions = await db.sessions
    .where('activity_ids')
    .equals(activityId)
    .toArray();
  return sessions
    .filter(s => s.deleted_at === null)
    .sort((a, b) => b.start_time - a.start_time);
}

export const updateSession = async (id: number, session: Omit<Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'>) => {
  const existing = await db.sessions.get(id);
  if (!existing) throw new Error('Session not found');
  return db.sessions.put({
    ...existing,
    ...session,
    id,
    updated_at: Date.now()
  });
};

export const deleteSession = async (id: number) => {
  const existing = await db.sessions.get(id);
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

  // Default Activities
  const sleepId = await db.activities.add({ 
    name: 'Sleep', 
    goal: 8, 
    goal_scale: 'daily', 
    color: '#3b82f6', 
    created_at: now, 
    updated_at: now, 
    sync_id: uuidv4(), 
    deleted_at: null 
  });
  const gymId = await db.activities.add({ 
    name: 'Gym', 
    goal: 1, 
    goal_scale: 'daily', 
    color: '#6b7280', 
    created_at: now, 
    updated_at: now, 
    sync_id: uuidv4(), 
    deleted_at: null 
  });
  const socialId = await db.activities.add({ 
    name: 'Socializing', 
    goal: 10, 
    goal_scale: 'weekly', 
    color: '#eab308', 
    created_at: now, 
    updated_at: now, 
    sync_id: uuidv4(), 
    deleted_at: null 
  });

  const oneHour = 3600 * 1000;
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

    await db.sessions.add({
      name: session.name,
      start_time: startTime,
      end_time: endTime,
      activity_ids: session.activityIds,
      sync_id: uuidv4(),
      updated_at: now,
      deleted_at: null,
    });
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
