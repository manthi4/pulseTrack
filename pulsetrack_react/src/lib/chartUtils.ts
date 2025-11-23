import { startOfDay, format, eachDayOfInterval, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { type Activity, type Session } from './db';
import { calculatePeriodGoal, normalizePeriod } from './dateUtils';

export type DateRange = '7' | '30' | '90' | 'custom';
export type AggregationType = 'daily' | 'weekly' | 'monthly';

export interface ActivityStats {
  activityId: number;
  average: number;
  total: number;
  max: number;
  min: number;
  currentGoal: number;
}

export const getDateRange = (dateRange: DateRange) => {
  const end = new Date();
  const dayCounts: Record<DateRange, number> = { '7': 6, '30': 29, '90': 89, 'custom': 29 };
  return { startDate: subDays(end, dayCounts[dateRange] || 29), endDate: end };
};

export const prepareChartData = (
  activities: Activity[], 
  sessions: Session[], 
  aggregation: AggregationType,
  startDate: Date,
  endDate: Date
) => {
  const intervalFunctions: Record<AggregationType, () => Date[]> = {
    daily: () => eachDayOfInterval({ start: startDate, end: endDate }),
    weekly: () => eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 }),
    monthly: () => eachMonthOfInterval({ start: startDate, end: endDate }),
  };
  const intervals = intervalFunctions[aggregation]?.() || intervalFunctions.daily();

  return intervals.map(interval => {
    const periodConfigs: Record<AggregationType, () => { start: Date; end: Date; label: string }> = {
      daily: () => {
        const start = startOfDay(interval);
        return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1), label: format(interval, 'MMM dd') };
      },
      weekly: () => {
        const start = startOfWeek(interval, { weekStartsOn: 1 });
        return { start, end: endOfWeek(interval, { weekStartsOn: 1 }), label: `Week ${format(start, 'MMM dd')}` };
      },
      monthly: () => {
        const start = startOfMonth(interval);
        return { start, end: endOfMonth(interval), label: format(interval, 'MMM yyyy') };
      },
    };
    const { start: periodStart, end: periodEnd, label: dateLabel } = periodConfigs[aggregation]?.() || periodConfigs.daily();

    const periodStartTime = periodStart.getTime();
    const periodEndTime = periodEnd.getTime();

    // Calculate time spent per activity for this period
    const activityTimes: Record<number, number> = {};
    
    sessions.forEach(session => {
      const sessionStart = session.start_time;
      const sessionEnd = session.end_time;
      
      // Check if session overlaps with this period
      if (sessionEnd >= periodStartTime && sessionStart <= periodEndTime) {
        const overlapStart = Math.max(sessionStart, periodStartTime);
        const overlapEnd = Math.min(sessionEnd, periodEndTime);
        const overlapDuration = overlapEnd - overlapStart;
        
        session.activity_ids.forEach(activityId => {
          if (!activityTimes[activityId]) {
            activityTimes[activityId] = 0;
          }
          activityTimes[activityId] += overlapDuration / session.activity_ids.length;
        });
      }
    });

    const dataPoint: Record<string, any> = {
      date: dateLabel,
      fullDate: format(interval, 'yyyy-MM-dd'),
      periodStart: periodStartTime,
      periodEnd: periodEndTime,
    };

    activities.forEach(activity => {
      if (activity.id !== undefined) {
        const hours = (activityTimes[activity.id] || 0) / (1000 * 60 * 60);
        dataPoint[`activity_${activity.id}`] = Number(hours.toFixed(2));
        // Also add name-based key for Tremor easier mapping if needed, but ID is safer
        dataPoint[activity.name] = Number(hours.toFixed(2));
      }
    });

    return dataPoint;
  });
};

export const calculateStats = (
  activities: Activity[],
  chartData: any[],
  aggregation: AggregationType
): ActivityStats[] => {
  const stats: ActivityStats[] = [];
  
  activities.forEach(activity => {
    if (activity.id === undefined) return;
    
    const dataKey = `activity_${activity.id}`;
    const values = chartData.map(point => point[dataKey] as number).filter(v => v > 0);
    
    if (values.length === 0) {
      stats.push({
        activityId: activity.id,
        average: 0,
        total: 0,
        max: 0,
        min: 0,
        currentGoal: activity.goal,
      });
      return;
    }
    
    const total = values.reduce((sum, v) => sum + v, 0);
    const average = total / chartData.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const dailyMultipliers: Record<'daily' | 'weekly' | 'monthly' | 'yearly', number> = {
      daily: 1,
      weekly: 1/7,
      monthly: 1/30,
      yearly: 1/365,
    };
    
    const periodGoal = aggregation === 'daily'
      ? Number((activity.goal * dailyMultipliers[activity.goal_scale]).toFixed(2))
      : calculatePeriodGoal(
          activity.goal,
          activity.goal_scale,
          normalizePeriod(aggregation),
          new Date(),
          new Date(Date.now() + (aggregation === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000)
        );
    
    stats.push({
      activityId: activity.id,
      average: Number(average.toFixed(2)),
      total: Number(total.toFixed(2)),
      max: Number(max.toFixed(2)),
      min: Number(min.toFixed(2)),
      currentGoal: Number(periodGoal.toFixed(2)),
    });
  });
  
  return stats;
};

