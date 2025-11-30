import { vi } from 'vitest'
import { type Activity, type Session } from '../../lib/db'

// Mock data stores
let mockActivities: Activity[] = []
let mockSessions: Session[] = []

// Mock DB functions
export const getActivities = vi.fn(async (includeDeleted = false) => {
    if (includeDeleted) {
        return mockActivities
    }
    return mockActivities.filter(a => a.deleted_at === null)
})

export const getSessions = vi.fn(async (includeDeleted = false) => {
    if (includeDeleted) {
        return mockSessions
    }
    return mockSessions.filter(s => s.deleted_at === null)
})

export const createActivity = vi.fn(async (activity: Omit<Activity, 'sync_id' | 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
    const newActivity: Activity = {
        ...activity,
        sync_id: `mock-${Date.now()}-${Math.random()}`,
        id: mockActivities.length + 1,
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: null,
    }
    mockActivities.push(newActivity)
    return newActivity.sync_id
})

export const updateActivity = vi.fn(async (syncId: string, activity: Partial<Omit<Activity, 'sync_id' | 'id' | 'created_at'>>) => {
    const index = mockActivities.findIndex(a => a.sync_id === syncId)
    if (index !== -1) {
        mockActivities[index] = {
            ...mockActivities[index],
            ...activity,
            updated_at: Date.now(),
        }
    }
})

export const deleteActivity = vi.fn(async (syncId: string) => {
    const activity = mockActivities.find(a => a.sync_id === syncId)
    if (activity) {
        activity.deleted_at = Date.now()
    }
})

export const createSession = vi.fn(async (session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => {
    const newSession: Session = {
        ...session,
        sync_id: `mock-${Date.now()}-${Math.random()}`,
        id: mockSessions.length + 1,
        updated_at: Date.now(),
        deleted_at: null,
    }
    mockSessions.push(newSession)
    return newSession.sync_id
})

export const updateSession = vi.fn(async (syncId: string, session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => {
    const index = mockSessions.findIndex(s => s.sync_id === syncId)
    if (index !== -1) {
        mockSessions[index] = {
            ...mockSessions[index],
            ...session,
            updated_at: Date.now(),
        }
    }
})

export const deleteSession = vi.fn(async (syncId: string) => {
    const session = mockSessions.find(s => s.sync_id === syncId)
    if (session) {
        session.deleted_at = Date.now()
    }
})

export const resetDB = vi.fn(async () => {
    mockActivities = []
    mockSessions = []
})

export const seedDB = vi.fn(async () => {
    // Mock seed implementation
})

// Helper to set mock data for tests
export function setMockActivities(activities: Activity[]) {
    mockActivities = activities
}

export function setMockSessions(sessions: Session[]) {
    mockSessions = sessions
}

export function clearMockData() {
    mockActivities = []
    mockSessions = []
}
