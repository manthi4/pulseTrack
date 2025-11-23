import React, { useMemo } from 'react';
import { type Activity, type Session } from '../lib/db';
import { getDateRange, type DateRange, type AggregationType } from '../lib/chartUtils';
import { calculatePeriodGoal, normalizePeriod } from '../lib/dateUtils';
import { format, getDay, getHours } from 'date-fns';
import { TrendingUp, TrendingDown, Target, Award, Clock, Calendar, Activity as ActivityIcon, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { calculateActivityStreak } from '../lib/activityUtils';

interface AnalyticsProps {
  activities: Activity[];
  sessions: Session[];
  dateRange: DateRange;
  aggregation: AggregationType;
}

interface Insight {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ 
  activities, 
  sessions, 
  dateRange,
  aggregation 
}) => {
  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const insights = useMemo(() => {
    const insightsList: Insight[] = [];
    
    if (activities.length === 0 || sessions.length === 0) {
      return insightsList;
    }

    // Filter sessions within date range
    const relevantSessions = sessions.filter(s => 
      s.end_time >= startDate.getTime() && s.start_time <= endDate.getTime()
    );

    if (relevantSessions.length === 0) {
      return insightsList;
    }

    // 1. Goal Achievement Analysis
    const goalAchievements = activities.map(activity => {
      if (activity.id === undefined) return null;
      
      const activitySessions = relevantSessions.filter(s => 
        s.activity_ids.includes(activity.id!)
      );
      
      const totalHours = activitySessions.reduce((sum, s) => {
        const duration = (s.end_time - s.start_time) / (1000 * 60 * 60);
        return sum + duration / s.activity_ids.length; // Split time across activities
      }, 0);

      const periodGoal = calculatePeriodGoal(
        activity.goal,
        activity.goal_scale,
        normalizePeriod(aggregation),
        startDate,
        endDate
      );

      const percentage = periodGoal > 0 ? (totalHours / periodGoal) * 100 : 0;
      
      return {
        activity,
        totalHours,
        goal: periodGoal,
        percentage,
        sessions: activitySessions.length
      };
    }).filter(Boolean) as Array<{
      activity: Activity;
      totalHours: number;
      goal: number;
      percentage: number;
      sessions: number;
    }>;

    const bestPerformer = goalAchievements.reduce((best, curr) => 
      curr.percentage > best.percentage ? curr : best
    , goalAchievements[0]);

    const worstPerformer = goalAchievements.reduce((worst, curr) => 
      curr.percentage < worst.percentage ? curr : worst
    , goalAchievements[0]);

    if (bestPerformer && bestPerformer.percentage > 0) {
      insightsList.push({
        title: 'Top Performer',
        value: `${bestPerformer.activity.name}`,
        description: `${bestPerformer.percentage.toFixed(0)}% of goal achieved (${bestPerformer.totalHours.toFixed(1)}h / ${bestPerformer.goal.toFixed(1)}h)`,
        icon: <Award className="h-5 w-5" />,
        trend: bestPerformer.percentage >= 100 ? 'up' : 'neutral',
        color: bestPerformer.activity.color
      });
    }

    if (worstPerformer && worstPerformer !== bestPerformer && worstPerformer.percentage < 100) {
      insightsList.push({
        title: 'Needs Attention',
        value: `${worstPerformer.activity.name}`,
        description: `${worstPerformer.percentage.toFixed(0)}% of goal achieved (${worstPerformer.totalHours.toFixed(1)}h / ${worstPerformer.goal.toFixed(1)}h)`,
        icon: <Target className="h-5 w-5" />,
        trend: 'down',
        color: worstPerformer.activity.color
      });
    }

    // 2. Consistency Analysis (coefficient of variation)
    const consistencyScores = goalAchievements.map(item => {
      const activitySessions = relevantSessions.filter(s => 
        s.activity_ids.includes(item.activity.id!)
      );

      if (activitySessions.length < 2) {
        return { activity: item.activity, score: 0, sessions: activitySessions.length };
      }

      const dailyHours: Record<string, number> = {};
      activitySessions.forEach(s => {
        const day = format(new Date(s.start_time), 'yyyy-MM-dd');
        const duration = (s.end_time - s.start_time) / (1000 * 60 * 60) / s.activity_ids.length;
        dailyHours[day] = (dailyHours[day] || 0) + duration;
      });

      const values = Object.values(dailyHours);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
      const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100)); // Higher is better

      return {
        activity: item.activity,
        score: consistencyScore,
        sessions: activitySessions.length
      };
    });

    const mostConsistent = consistencyScores
      .filter(c => c.sessions >= 3)
      .reduce((best, curr) => 
        curr.score > best.score ? curr : best
      , consistencyScores[0]);

    if (mostConsistent && mostConsistent.sessions >= 3) {
      insightsList.push({
        title: 'Most Consistent',
        value: `${mostConsistent.activity.name}`,
        description: `${mostConsistent.score.toFixed(0)}% consistency score`,
        icon: <ActivityIcon className="h-5 w-5" />,
        trend: 'up',
        color: mostConsistent.activity.color
      });
    }

    // 3. Peak Time Analysis
    const hourDistribution: Record<number, number> = {};
    relevantSessions.forEach(s => {
      const hour = getHours(new Date(s.start_time));
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourDistribution)
      .reduce((max, [hour, count]) => 
        count > max.count ? { hour: parseInt(hour), count } : max
      , { hour: 0, count: 0 });

    if (peakHour.count > 0) {
      const hourLabel = peakHour.hour === 0 ? '12 AM' : 
                       peakHour.hour < 12 ? `${peakHour.hour} AM` :
                       peakHour.hour === 12 ? '12 PM' :
                       `${peakHour.hour - 12} PM`;
      
      insightsList.push({
        title: 'Peak Activity Time',
        value: hourLabel,
        description: `${peakHour.count} session${peakHour.count !== 1 ? 's' : ''} started at this hour`,
        icon: <Clock className="h-5 w-5" />,
        trend: 'neutral'
      });
    }

    // 4. Day of Week Analysis
    const dayDistribution: Record<number, number> = {};
    relevantSessions.forEach(s => {
      const day = getDay(new Date(s.start_time));
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });

    const peakDay = Object.entries(dayDistribution)
      .reduce((max, [day, count]) => 
        count > max.count ? { day: parseInt(day), count } : max
      , { day: 0, count: 0 });

    if (peakDay.count > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      insightsList.push({
        title: 'Most Active Day',
        value: dayNames[peakDay.day],
        description: `${peakDay.count} session${peakDay.count !== 1 ? 's' : ''} logged`,
        icon: <Calendar className="h-5 w-5" />,
        trend: 'neutral'
      });
    }

    // 5. Activity Combinations
    const combinationCounts: Record<string, number> = {};
    relevantSessions.forEach(s => {
      if (s.activity_ids.length > 1) {
        const sortedIds = [...s.activity_ids].sort().join(',');
        combinationCounts[sortedIds] = (combinationCounts[sortedIds] || 0) + 1;
      }
    });

    const topCombination = Object.entries(combinationCounts)
      .reduce((max, [ids, count]) => 
        count > max.count ? { ids, count } : max
      , { ids: '', count: 0 });

    if (topCombination.count > 0) {
      const activityNames = topCombination.ids.split(',').map(id => {
        const activity = activities.find(a => a.id === parseInt(id));
        return activity?.name || 'Unknown';
      }).join(' + ');

      insightsList.push({
        title: 'Favorite Combo',
        value: activityNames,
        description: `${topCombination.count} session${topCombination.count !== 1 ? 's' : ''} with this combination`,
        icon: <ActivityIcon className="h-5 w-5" />,
        trend: 'neutral'
      });
    }

    // 6. Total Sessions
    insightsList.push({
      title: 'Total Sessions',
      value: `${relevantSessions.length}`,
      description: `Across ${activities.length} activit${activities.length !== 1 ? 'ies' : 'y'}`,
      icon: <ActivityIcon className="h-5 w-5" />,
      trend: 'neutral'
    });

    // 7. Average Session Duration
    const avgDuration = relevantSessions.reduce((sum, s) => 
      sum + (s.end_time - s.start_time) / (1000 * 60 * 60)
    , 0) / relevantSessions.length;

    if (avgDuration > 0) {
      insightsList.push({
        title: 'Avg Session Duration',
        value: `${avgDuration.toFixed(1)}h`,
        description: `Average time per session`,
        icon: <Clock className="h-5 w-5" />,
        trend: 'neutral'
      });
    }

    // 8. Longest Streak
    const activityStreaks = activities
      .filter(a => a.id !== undefined)
      .map(activity => ({
        activity,
        streak: calculateActivityStreak(activity, sessions)
      }))
      .filter(item => item.streak.longest > 0);

    if (activityStreaks.length > 0) {
      const longestStreakActivity = activityStreaks.reduce((best, curr) => 
        curr.streak.longest > best.streak.longest ? curr : best
      , activityStreaks[0]);

      if (longestStreakActivity && longestStreakActivity.streak.longest > 0) {
        insightsList.push({
          title: 'Longest Streak',
          value: `${longestStreakActivity.streak.longest} ${longestStreakActivity.streak.longest === 1 ? 'day' : 'days'}`,
          description: `${longestStreakActivity.activity.name}`,
          icon: <Flame className="h-5 w-5" />,
          trend: 'up',
          color: longestStreakActivity.activity.color
        });
      }
    }

    return insightsList;
  }, [activities, sessions, startDate, endDate, aggregation]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
      <h3 className="font-semibold leading-none tracking-tight text-xl mb-6">Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "rounded-lg border p-4 transition-all hover:shadow-md",
              insight.trend === 'up' && "border-green-500/20 bg-green-500/5",
              insight.trend === 'down' && "border-red-500/20 bg-red-500/5",
              !insight.trend || insight.trend === 'neutral' ? "border-border/50 bg-muted/30" : ""
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className={cn(
                    "p-1.5 rounded-md",
                    insight.trend === 'up' && "bg-green-500/10 text-green-600 dark:text-green-400",
                    insight.trend === 'down' && "bg-red-500/10 text-red-600 dark:text-red-400",
                    (!insight.trend || insight.trend === 'neutral') && "bg-muted text-muted-foreground"
                  )}
                  style={insight.color && !insight.trend ? { backgroundColor: `${insight.color}20`, color: insight.color } : undefined}
                >
                  {insight.icon}
                </div>
                <h4 className="text-sm font-medium text-muted-foreground">{insight.title}</h4>
              </div>
              {insight.trend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
              {insight.trend === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="text-2xl font-bold mb-1" style={insight.color ? { color: insight.color } : undefined}>
              {insight.value}
            </div>
            <p className="text-xs text-muted-foreground">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

