import Dexie, { type Table } from 'dexie';

// Define the time scale type
export type TimeScale = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Define interfaces
export interface Task {
    id?: number;
    name: string;
    goal: number;
    goal_scale: TimeScale;
    created_at: number;
}

export interface Session {
    id?: number;
    task_id: number;
    start_time: number;
    end_time: number;
    tags: string[]; // Changed to array of strings for better handling
}

class TimeTrackingDatabase extends Dexie {
    tasks!: Table<Task>;
    sessions!: Table<Session>;

    constructor() {
        super('PulseTrackDB'); // Renamed for a fresh start/migration separation if needed, but sticking to plan implies we might just want to clear old data or use a new name to avoid conflicts. Let's use a new name to be safe and clean.

        this.version(1).stores({
            tasks: '++id, name, created_at',
            sessions: '++id, task_id, start_time, end_time, *tags' // *tags for multi-entry indexing if needed
        });
    }

    // Task Methods
    async getAllTasks(): Promise<Task[]> {
        return await this.tasks.toArray();
    }

    async createTask(name: string, goal: number = 0, goal_scale: TimeScale = 'daily'): Promise<number> {
        return await this.tasks.add({
            name,
            goal,
            goal_scale,
            created_at: Date.now()
        });
    }

    async deleteTask(taskId: number): Promise<void> {
        await this.transaction('rw', this.tasks, this.sessions, async () => {
            await this.sessions.where('task_id').equals(taskId).delete();
            await this.tasks.delete(taskId);
        });
    }

    // Session Methods
    async addSession(sessionId: Omit<Session, 'id'>): Promise<number> {
        return await this.sessions.add(sessionId as Session);
    }

    async getTaskSessions(taskId: number): Promise<Session[]> {
        return await this.sessions.where('task_id').equals(taskId).toArray();
    }

    async deleteSession(sessionId: number): Promise<void> {
        await this.sessions.delete(sessionId);
    }

    async getSessionsInRange(taskId: number, startDate: Date, endDate: Date): Promise<Session[]> {
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();

        return await this.sessions
            .where('task_id').equals(taskId)
            .and(session => session.start_time >= startTime && session.end_time <= endTime)
            .toArray();
    }
}

export const db = new TimeTrackingDatabase();