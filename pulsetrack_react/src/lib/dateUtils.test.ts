import { describe, it, expect } from 'vitest'
import {
    getPeriodRange,
    normalizePeriod,
    formatDateTimeLocal,
    calculatePeriodGoal,
} from './dateUtils'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

describe('dateUtils', () => {
    describe('normalizePeriod', () => {
        it('should normalize daily to day', () => {
            expect(normalizePeriod('daily')).toBe('day')
        })

        it('should normalize weekly to week', () => {
            expect(normalizePeriod('weekly')).toBe('week')
        })

        it('should normalize monthly to month', () => {
            expect(normalizePeriod('monthly')).toBe('month')
        })

        it('should normalize yearly to year', () => {
            expect(normalizePeriod('yearly')).toBe('year')
        })

        it('should return TimePeriod as-is', () => {
            expect(normalizePeriod('day')).toBe('day')
            expect(normalizePeriod('week')).toBe('week')
            expect(normalizePeriod('month')).toBe('month')
            expect(normalizePeriod('year')).toBe('year')
        })
    })

    describe('getPeriodRange', () => {
        const testDate = new Date('2024-03-15T12:00:00Z') // A Friday

        it('should get day range', () => {
            const range = getPeriodRange(testDate, 'day')
            expect(range.start).toEqual(startOfDay(testDate))
            expect(range.end).toEqual(endOfDay(testDate))
        })

        it('should get week range (starting Monday)', () => {
            const range = getPeriodRange(testDate, 'week')
            expect(range.start).toEqual(startOfWeek(testDate, { weekStartsOn: 1 }))
            expect(range.end).toEqual(endOfWeek(testDate, { weekStartsOn: 1 }))
        })

        it('should get month range', () => {
            const range = getPeriodRange(testDate, 'month')
            expect(range.start).toEqual(startOfMonth(testDate))
            expect(range.end).toEqual(endOfMonth(testDate))
        })

        it('should get year range', () => {
            const range = getPeriodRange(testDate, 'year')
            expect(range.start).toEqual(startOfYear(testDate))
            expect(range.end).toEqual(endOfYear(testDate))
        })

        it('should handle GoalScale types', () => {
            const dailyRange = getPeriodRange(testDate, 'daily')
            expect(dailyRange.start).toEqual(startOfDay(testDate))

            const weeklyRange = getPeriodRange(testDate, 'weekly')
            expect(weeklyRange.start).toEqual(startOfWeek(testDate, { weekStartsOn: 1 }))
        })
    })

    describe('formatDateTimeLocal', () => {
        it('should format date for datetime-local input', () => {
            const date = new Date('2024-03-15T14:30:00Z')
            const formatted = formatDateTimeLocal(date)

            // Should be in YYYY-MM-DDTHH:mm format
            expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        })

        it('should handle timezone offset correctly', () => {
            const date = new Date('2024-01-01T00:00:00Z')
            const formatted = formatDateTimeLocal(date)

            // The format should always be valid
            expect(formatted.length).toBe(16)
            expect(formatted.charAt(10)).toBe('T')
        })
    })

    describe('calculatePeriodGoal', () => {
        it('should return goal as-is when scales match', () => {
            const date = new Date('2024-03-15')
            const { start, end } = getPeriodRange(date, 'day')

            const result = calculatePeriodGoal(10, 'daily', 'day', start, end)
            expect(result).toBe(10)
        })

        it('should calculate daily goals for a week period', () => {
            const date = new Date('2024-03-15')
            const { start, end } = getPeriodRange(date, 'week')

            // Daily goal of 2 hours over a week (7 days) = 14 hours
            const result = calculatePeriodGoal(2, 'daily', 'week', start, end)
            expect(result).toBe(14)
        })

        it('should calculate weekly goals for a month period', () => {
            const date = new Date('2024-03-15')
            const { start, end } = getPeriodRange(date, 'month')

            // Weekly goal of 7 hours = 1 hour/day
            // March 2024 has 31 days
            const result = calculatePeriodGoal(7, 'weekly', 'month', start, end)
            expect(result).toBeCloseTo(31, 0) // ~31 hours
        })

        it('should handle monthl goals for yearly period', () => {
            const date = new Date('2024-03-15')
            const { start, end } = getPeriodRange(date, 'year')

            // Monthly goal of 30 hours over a year (2024 is leap year with 366 days)
            const result = calculatePeriodGoal(30, 'monthly', 'year', start, end)
            expect(result).toBeCloseTo(366, 0) // ~366 hours for leap year
        })

        it('should handle yearly goals for day period', () => {
            const date = new Date('2024-03-15')
            const { start, end } = getPeriodRange(date, 'day')

            // Yearly goal of 365 hours = 1 hour/day
            const result = calculatePeriodGoal(365, 'yearly', 'day', start, end)
            expect(result).toBeCloseTo(1, 1)
        })
    })
})
