import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { type Activity, type Session } from '../lib/db';
import { type TimePeriod, type GoalScale, getPeriodRange } from '../lib/dateUtils';

interface DonutChartProps {
  activity: Activity;
  sessions: Session[];
  timePeriod?: TimePeriod;
  selectedDate?: Date;
  showPeriodLabel?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({ 
  activity, 
  sessions, 
  timePeriod, 
  selectedDate,
  showPeriodLabel = false 
}) => {
  const { progress, goal, percentage, COLORS, data } = useMemo(() => {
    const dateToUse = selectedDate || new Date();
    
    // Use timePeriod prop if provided, otherwise fall back to activity.goal_scale
    const period = (timePeriod || activity.goal_scale) as TimePeriod | GoalScale;

    const { start, end } = getPeriodRange(dateToUse, period);
    const periodStartTime = start.getTime();
    const periodEndTime = end.getTime();

    const relevantSessions = sessions.filter(session => {
      const sessionEndTime = new Date(session.end_time).getTime();
      return session.activity_ids.includes(activity.id!) &&
        sessionEndTime >= periodStartTime &&
        sessionEndTime <= periodEndTime;
    });

    const totalMilliseconds = relevantSessions.reduce((acc, session) => {
      return acc + (session.end_time - session.start_time);
    }, 0);

    const calculatedProgress = totalMilliseconds / (1000 * 60 * 60);
    const currentGoal = activity.goal;
    const remaining = Math.max(0, currentGoal - calculatedProgress);
    
    const chartData = [
      { name: 'Completed', value: Number(calculatedProgress.toFixed(1)) },
      { name: 'Remaining', value: Number(remaining.toFixed(1)) },
    ];

    // Punchy colors for dark mode
    const colors = ['#3b82f6', '#1e293b']; // Bright blue for completed, dark slate for remaining

    // Handle over-achievement
    if (calculatedProgress > currentGoal) {
        colors[0] = '#10b981'; // Vibrant emerald green
        colors[1] = '#10b981';
        chartData[1].value = 0;
    }

    const pct = currentGoal > 0 ? Math.min(100, (calculatedProgress / currentGoal) * 100) : 0;

    return {
      progress: calculatedProgress,
      goal: currentGoal,
      percentage: pct,
      COLORS: colors,
      data: chartData
    };
  }, [activity, sessions, timePeriod, selectedDate]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-2xl font-bold">{progress.toFixed(1)}h</div>
        <div className="text-xs text-muted-foreground mt-1">
          {showPeriodLabel && timePeriod
            ? `Viewing: ${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} • Goal: ${goal}h ${activity.goal_scale}`
            : `${activity.goal_scale.charAt(0).toUpperCase() + activity.goal_scale.slice(1)} Goal: ${goal}h`
          }
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
