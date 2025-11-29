import React, { useMemo } from 'react';
import { type Activity, type Session } from '../../lib/db';
import { type TimePeriod } from '../../lib/dateUtils';
import { calculateActivityProgress } from '../../lib/activityUtils';
import { capitalize } from '../../lib/utils';

interface ProgressBarProps {
  activity: Activity;
  sessions: Session[];
  timePeriod?: TimePeriod;
  selectedDate?: Date;
  showPeriodLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  activity, 
  sessions, 
  timePeriod, 
  selectedDate,
  showPeriodLabel = false 
}) => {
  const { progress, goal, percentage } = useMemo(
    () => calculateActivityProgress(activity, sessions, timePeriod, selectedDate),
    [activity, sessions, timePeriod, selectedDate]
  );

  const isOverGoal = progress > goal;
  const activityColor = activity.color || '#3b82f6';
  const barWidth = Math.min(100, percentage);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xl sm:text-2xl font-bold">{progress.toFixed(1)}h</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">
            {showPeriodLabel && timePeriod
              ? `Viewing: ${capitalize(timePeriod)} • Goal: ${goal}h ${activity.goal_scale}`
              : `${capitalize(activity.goal_scale)} Goal: ${goal}h`}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xl sm:text-2xl font-bold">{percentage.toFixed(0)}%</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">of goal</div>
        </div>
      </div>
      
      <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${barWidth}%`,
            backgroundColor: isOverGoal ? '#10b981' : activityColor
          }}
        />
      </div>
      
      {isOverGoal && (
        <div className="text-sm text-emerald-500 font-medium">
          Exceeded goal by {(progress - goal).toFixed(1)}h
        </div>
      )}
    </div>
  );
};

