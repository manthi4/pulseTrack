import { type Activity, type Session } from './db';
import { type TimePeriod, type GoalScale, getPeriodRange, calculatePeriodGoal, normalizePeriod } from './dateUtils';
import { startOfDay, endOfDay, differenceInDays, format } from 'date-fns';

export interface ActivityProgress {
  progress: number;
  goal: number;
  percentage: number;
}

export interface ActivityStreak {
  current: number;
  longest: number;
}

/**
 * Calculates progress for an activity within a given time period
 */
export function calculateActivityProgress(
  activity: Activity,
  sessions: Session[],
  timePeriod?: TimePeriod,
  selectedDate?: Date
): ActivityProgress {
  const dateToUse = selectedDate || new Date();
  const period = (timePeriod || activity.goal_scale) as TimePeriod | GoalScale;
  const { start, end } = getPeriodRange(dateToUse, period);
  const periodStartTime = start.getTime();
  const periodEndTime = end.getTime();

  const relevantSessions = sessions.filter(session => {
    const sessionEndTime = new Date(session.end_time).getTime();
    return activity.sync_id && session.activity_ids.includes(activity.sync_id) &&
      sessionEndTime >= periodStartTime &&
      sessionEndTime <= periodEndTime;
  });

  const totalMilliseconds = relevantSessions.reduce((acc, session) => {
    return acc + (session.end_time - session.start_time);
  }, 0);

  const calculatedProgress = totalMilliseconds / (1000 * 60 * 60);
  const normalizedPeriod = normalizePeriod(period);
  const currentGoal = Number(calculatePeriodGoal(
    activity.goal,
    activity.goal_scale,
    normalizedPeriod,
    start,
    end
  ).toFixed(2));

  const percentage = currentGoal > 0 ? Math.min(100, (calculatedProgress / currentGoal) * 100) : 0;

  return {
    progress: calculatedProgress,
    goal: currentGoal,
    percentage,
  };
}

/**
 * Helper function to check if a day's goal is met for an activity
 */
function isDayGoalMet(
  activity: Activity,
  sessions: Session[],
  date: Date
): boolean {
  if (!activity.sync_id) return false;

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const dayStartTime = dayStart.getTime();
  const dayEndTime = dayEnd.getTime();

  // Get sessions for this activity on this day
  const daySessions = sessions.filter(s => {
    const sessionEndTime = new Date(s.end_time).getTime();
    return s.activity_ids.includes(activity.sync_id!) &&
      sessionEndTime >= dayStartTime &&
      sessionEndTime <= dayEndTime;
  });

  if (daySessions.length === 0) {
    return false;
  }

  // Calculate total hours for the day
  const totalMilliseconds = daySessions.reduce((acc, session) => {
    // Split time across activities if multiple activities in session
    const duration = (session.end_time - session.start_time) / session.activity_ids.length;
    return acc + duration;
  }, 0);

  const totalHours = totalMilliseconds / (1000 * 60 * 60);

  // Calculate the daily goal
  const { start, end } = getPeriodRange(date, 'day');
  const dailyGoal = calculatePeriodGoal(
    activity.goal,
    activity.goal_scale,
    'day',
    start,
    end
  );

  // Goal is met if total hours >= daily goal
  return totalHours >= dailyGoal;
}

/**
 * Calculates streak information for an activity
 * A streak is consecutive days where the activity's daily goal is met
 */
export function calculateActivityStreak(
  activity: Activity,
  sessions: Session[]
): ActivityStreak {
  if (!activity.sync_id || sessions.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Get all sessions for this activity
  const activitySessions = sessions.filter(s => 
    s.activity_ids.includes(activity.sync_id!)
  );

  if (activitySessions.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Find all days that have sessions (to limit our search)
  const daysWithSessions = new Set<string>();
  activitySessions.forEach(session => {
    const day = format(startOfDay(new Date(session.start_time)), 'yyyy-MM-dd');
    daysWithSessions.add(day);
  });

  // Check each day with sessions to see if goal is met
  const daysWithGoalMet = new Set<string>();
  daysWithSessions.forEach(dayStr => {
    const day = new Date(dayStr);
    if (isDayGoalMet(activity, sessions, day)) {
      daysWithGoalMet.add(dayStr);
    }
  });

  if (daysWithGoalMet.size === 0) {
    return { current: 0, longest: 0 };
  }

  // Convert to sorted array of dates
  const sortedDays = Array.from(daysWithGoalMet)
    .map(day => new Date(day))
    .sort((a, b) => a.getTime() - b.getTime());

  // Calculate current streak (from today backwards)
  const today = startOfDay(new Date());
  let currentStreak = 0;
  let checkDate = today;
  
  // Check if today's goal is met
  const todayStr = format(today, 'yyyy-MM-dd');
  if (daysWithGoalMet.has(todayStr)) {
    currentStreak = 1;
    checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    
    // Count backwards
    while (true) {
      const checkDateStr = format(checkDate, 'yyyy-MM-dd');
      if (daysWithGoalMet.has(checkDateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    // If today's goal isn't met, check yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    
    if (daysWithGoalMet.has(yesterdayStr)) {
      currentStreak = 1;
      checkDate = new Date(yesterday);
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Count backwards from yesterday
      while (true) {
        const checkDateStr = format(checkDate, 'yyyy-MM-dd');
        if (daysWithGoalMet.has(checkDateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  // Calculate longest streak (across all time)
  let longestStreak = sortedDays.length > 0 ? 1 : 0;
  let tempStreak = sortedDays.length > 0 ? 1 : 0;

  for (let i = 1; i < sortedDays.length; i++) {
    const daysDiff = differenceInDays(sortedDays[i], sortedDays[i - 1]);
    
    if (daysDiff === 1) {
      // Consecutive day
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      // Gap found, reset temp streak
      tempStreak = 1;
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
  };
}

