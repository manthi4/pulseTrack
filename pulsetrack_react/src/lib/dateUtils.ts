import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
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

function normalizePeriod(period: TimePeriod | GoalScale): TimePeriod {
  switch (period) {
    case 'daily': return 'day';
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'yearly': return 'year';
    default: return period as TimePeriod;
  }
}
