import { describe, it, expect } from 'vitest'
import { calculateActivityProgress, calculateActivityStreak } from './activityUtils'
import { createMockActivity, createMockSession } from '../test/utils'

describe('activityUtils', () => {
    describe('calculateActivityProgress', () => {
        it('should calculate progress correctly for a single session', () => {
            const activity = createMockActivity({
                sync_id: 'act-1',
                goal: 2,
                goal_scale: 'daily',
            })

            const session = createMockSession({
                activity_ids: ['act-1'],
                start_time: Date.now() - 3600000, // 1 hour ago
                end_time: Date.now(),
            })

            const progress = calculateActivityProgress(activity, [session])

            expect(progress.progress).toBeCloseTo(1, 1) // 1 hour of progress
            expect(progress.goal).toBe(2) // 2 hour goal
            expect(progress.percentage).toBeCloseTo(50, 0) // 50% complete
        })

        it('should handle multiple sessions', () => {
            const activity = createMockActivity({
                sync_id: 'act-1',
                goal: 4,
                goal_scale: 'daily',
            })

            const sessions = [
                createMockSession({
                    activity_ids: ['act-1'],
                    start_time: Date.now() - 7200000, // 2 hours ago
                    end_time: Date.now() - 3600000, // 1 hour ago
                }),
                createMockSession({
                    activity_ids: ['act-1'],
                    start_time: Date.now() - 3600000, // 1 hour ago
                    end_time: Date.now(),
                }),
            ]

            const progress = calculateActivityProgress(activity, sessions)

            expect(progress.progress).toBeCloseTo(2, 1) // 2 hours total
            expect(progress.goal).toBe(4)
            expect(progress.percentage).toBeCloseTo(50, 0)
        })

        it('should return 0 progress when no sessions match', () => {
            const activity = createMockActivity({
                sync_id: 'act-1',
                goal: 2,
                goal_scale: 'daily',
            })

            const session = createMockSession({
                activity_ids: ['act-2'], // Different activity
            })

            const progress = calculateActivityProgress(activity, [session])

            expect(progress.progress).toBe(0)
            expect(progress.percentage).toBe(0)
        })

        it('should cap percentage at 100%', () => {
            const activity = createMockActivity({
                sync_id: 'act-1',
                goal: 1,
                goal_scale: 'daily',
            })

            const session = createMockSession({
                activity_ids: ['act-1'],
                start_time: Date.now() - 7200000, // 2 hours ago (exceeds goal)
                end_time: Date.now(),
            })

            const progress = calculateActivityProgress(activity, [session])

            expect(progress.percentage).toBeLessThanOrEqual(100)
        })

        it('should handle weekly goal scale', () => {
            const activity = createMockActivity({
                sync_id: 'act-1',
                goal: 14,
                goal_scale: 'weekly',
            })

            // Session from today
            const session = createMockSession({
                activity_ids: ['act-1'],
                start_time: Date.now() - 3600000,
                end_time: Date.now(),
            })

            const progress = calculateActivityProgress(activity, [session], 'week')

            expect(progress.progress).toBeCloseTo(1, 1)
            expect(progress.goal).toBe(14) // Weekly goal
        })

        it('should filter sessions outside the time period', () => {
            const activity = createMockActivity({
                sync_id: 'act-1',
                goal: 2,
                goal_scale: 'daily',
            })

            const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000
            const oldSession = createMockSession({
                activity_ids: ['act-1'],
                start_time: lastWeek - 3600000,
                end_time: lastWeek,
            })

            const progress = calculateActivityProgress(activity, [oldSession], 'day')

            // Old session should not count for today
            expect(progress.progress).toBe(0)
        })
    })

    describe('calculateActivityStreak', () => {
        it('should return 0 streak when no sessions', () => {
            const activity = createMockActivity({ sync_id: 'act-1' })
            const streak = calculateActivityStreak(activity, [])

            expect(streak.current).toBe(0)
            expect(streak.longest).toBe(0)
        })

        it('should return 0 streak when no sessions for this activity', () => {
            const activity = createMockActivity({ sync_id: 'act-1' })
            const session = createMockSession({ activity_ids: ['act-2'] })

            const streak = calculateActivityStreak(activity, [session])

            expect(streak.current).toBe(0)
            expect(streak.longest).toBe(0)
        })

        it('should calculate current streak when goal met today', () => {
            const activity = createMockActivity({
                sync_id: 'act-1',
                goal: 1,
                goal_scale: 'daily',
            })

            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            // Session meeting today's goal
            const session = createMockSession({
                activity_ids: ['act-1'],
                start_time: today.getTime(),
                end_time: today.getTime() + 3600000, // 1 hour
            })

            const streak = calculateActivityStreak(activity, [session])

            expect(streak.current).toBeGreaterThanOrEqual(1)
        })

        it('should handle activity without sync_id', () => {
            const activity = createMockActivity({ sync_id: '' })
            const session = createMockSession({ activity_ids: ['act-1'] })

            const streak = calculateActivityStreak(activity, [session])

            expect(streak.current).toBe(0)
            expect(streak.longest).toBe(0)
        })
    })
})
