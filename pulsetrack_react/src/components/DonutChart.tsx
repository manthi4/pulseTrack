import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { type Activity, type Session } from '../lib/db';
import { type TimePeriod } from '../lib/dateUtils';
import { calculateActivityProgress } from '../lib/activityUtils';
import { capitalize } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme } = useTheme();
  
  const { progress, goal, percentage, COLORS, data } = useMemo(() => {
    const { progress: calculatedProgress, goal: currentGoal, percentage: pct } = 
      calculateActivityProgress(activity, sessions, timePeriod, selectedDate);
    
    const remaining = Math.max(0, currentGoal - calculatedProgress);
    const chartData = [
      { name: 'Completed', value: Number(calculatedProgress.toFixed(1)) },
      { name: 'Remaining', value: Number(remaining.toFixed(1)) },
    ];

    const activityColor = activity.color || '#3b82f6';
    
    // Get the muted color from CSS variable (same as progress bar background)
    // This ensures it matches exactly with bg-muted class
    const getMutedColor = () => {
      if (typeof window !== 'undefined') {
        const root = getComputedStyle(document.documentElement);
        const mutedHsl = root.getPropertyValue('--muted').trim();
        if (mutedHsl) {
          return `hsl(${mutedHsl})`;
        }
      }
      // Fallback colors if CSS variable is not available
      return theme.mode === 'light' 
        ? 'hsl(210, 40%, 96.1%)' // Light muted color
        : '#1e293b'; // Dark slate for dark mode
    };
    
    const remainingColor = getMutedColor();
    
    const colors = calculatedProgress > currentGoal 
      ? ['#10b981', '#10b981'] // Over-achievement: emerald green
      : [activityColor, remainingColor]; // Normal: activity color + muted color

    if (calculatedProgress > currentGoal) {
      chartData[1].value = 0;
    }

    return {
      progress: calculatedProgress,
      goal: currentGoal,
      percentage: pct,
      COLORS: colors,
      data: chartData
    };
  }, [activity, sessions, timePeriod, selectedDate, theme.mode]);

  return (
    <div className="w-full h-full flex items-center justify-center relative min-w-0 min-h-[192px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={192}>
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
        <div className="text-xl sm:text-2xl font-bold">{progress.toFixed(1)}h</div>
        <div className="text-xs text-muted-foreground mt-1 text-center px-2">
          {showPeriodLabel && timePeriod
            ? `Viewing: ${capitalize(timePeriod)} • Goal: ${goal}h ${activity.goal_scale}`
            : `${capitalize(activity.goal_scale)} Goal: ${goal}h`}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
