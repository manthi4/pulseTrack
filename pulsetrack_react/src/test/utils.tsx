import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { type Activity, type Session } from '../lib/db'

// Custom render function that includes providers
export function renderWithProviders(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return <ThemeProvider>{children}</ThemeProvider>
    }

    return render(ui, { wrapper: Wrapper, ...options })
}

// Mock data factories
export function createMockActivity(overrides?: Partial<Activity>): Activity {
    return {
        sync_id: `activity-${Math.random().toString(36).substr(2, 9)}`,
        id: Math.floor(Math.random() * 1000),
        name: 'Test Activity',
        goal: 2,
        goal_scale: 'daily',
        color: '#3b82f6',
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: null,
        ...overrides,
    }
}

export function createMockSession(overrides?: Partial<Session>): Session {
    const startTime = Date.now() - 3600000 // 1 hour ago
    return {
        sync_id: `session-${Math.random().toString(36).substr(2, 9)}`,
        id: Math.floor(Math.random() * 1000),
        name: 'Test Session',
        start_time: startTime,
        end_time: Date.now(),
        activity_ids: [],
        updated_at: Date.now(),
        deleted_at: null,
        ...overrides,
    }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }
