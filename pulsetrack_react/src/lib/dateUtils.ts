import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  differenceInDays
} from 'date-fns';

export type TimePeriod = 'day' | 'week' | 'month' | 'year';
export type GoalScale = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function getPeriodRange(date: Date, period: TimePeriod | GoalScale) {
  const normalizedPeriod = normalizePeriod(period);
  
  switch (normalizedPeriod) {
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date)
      };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
    case 'year':
      return {
        start: startOfYear(date),
        end: endOfYear(date)
      };
    default:
      return {
        start: new Date(0),
        end: new Date()
      };
  }
}

export function normalizePeriod(period: TimePeriod | GoalScale): TimePeriod {
  switch (period) {
    case 'daily': return 'day';
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'yearly': return 'year';
    default: return period as TimePeriod;
  }
}

/**
 * Formats a Date for datetime-local input (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeLocal(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * Calculates the aggregate goal for a given period based on the activity's goal scale.
 * For daily goals, multiplies by the number of days in the period.
 * For other goal scales, converts appropriately or uses as-is if they match.
 */
export function calculatePeriodGoal(
  goal: number,
  goalScale: GoalScale,
  period: TimePeriod,
  periodStart: Date,
  periodEnd: Date
): number {
  // If goal scale matches the period, use the goal as-is
  const normalizedGoalScale = normalizePeriod(goalScale);
  if (normalizedGoalScale === period) {
    return goal;
  }

  // Convert goal to daily equivalent
  const dailyMultipliers: Record<GoalScale, number> = {
    daily: 1,
    weekly: 1 / 7,
    monthly: 1 / 30,
    yearly: 1 / 365,
  };
  const dailyEquivalent = goal * dailyMultipliers[goalScale];

  // Calculate days in the period and multiply by daily equivalent
  const daysInPeriod = differenceInDays(periodEnd, periodStart) + 1; // +1 to include both start and end days
  return dailyEquivalent * daysInPeriod;
}
