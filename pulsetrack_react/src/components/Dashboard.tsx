import React, { useState, useMemo } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { ProgressBar } from './ProgressBar';
import { TrendChart } from './TrendChart';
import { ActivityGrid } from './ActivityGrid';
import { SessionList } from './SessionList';
import { Button } from './ui/Button';
import { LogSessionDialog } from './LogSessionDialog';
import { ActivityDialog } from './ActivityDialog';
import { type Activity, type Session } from '../lib/db';
import { type TimePeriod } from './TimePeriodSelector';
import { getPeriodRange } from '../lib/dateUtils';
import { calculateActivityStreak } from '../lib/activityUtils';
import { Flame } from 'lucide-react';

interface DashboardProps {
  activities: Activity[];
  sessions: Session[];
  selectedActivityId: string | null;
  onSelectActivity: (syncId: string | null) => void;

  // Data Operations
  onAddActivity: (activity: Omit<Activity, 'sync_id' | 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<void>;
  onEditActivity: (syncId: string, activity: Partial<Omit<Activity, 'sync_id' | 'id' | 'created_at'>>) => Promise<void>;
  onDeleteActivity: (syncId: string) => Promise<boolean>;

  onAddSession: (session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => Promise<void>;
  onEditSession: (syncId: string, session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => Promise<void>;
  onDeleteSession: (syncId: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activities,
  sessions,
  selectedActivityId,
  onSelectActivity,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onAddSession,
  onEditSession,
  onDeleteSession,
}) => {
  // UI State
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLogSessionOpen, setIsLogSessionOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const selectedActivity = activities.find(a => a.sync_id === selectedActivityId);

  // Calculate streak for selected activity
  const streak = useMemo(() => {
    if (!selectedActivity) return null;
    return calculateActivityStreak(selectedActivity, sessions);
  }, [selectedActivity, sessions]);

  // Computed Data
  const displayedSessions = useMemo(() => {
    const { start, end } = getPeriodRange(selectedDate, timePeriod);
    const periodStartTime = start.getTime();
    const periodEndTime = end.getTime();

    return (selectedActivityId
      ? sessions.filter(s => s.activity_ids.includes(selectedActivityId))
      : sessions
    ).filter(s => {
      const sessionEndTime = new Date(s.end_time).getTime();
      return sessionEndTime >= periodStartTime && sessionEndTime <= periodEndTime;
    });
  }, [sessions, selectedActivityId, selectedDate, timePeriod]);

  // Dialog handlers
  const openActivityDialog = (activity?: Activity) => {
    setEditingActivity(activity || null);
    setIsActivityDialogOpen(true);
  };

  const closeActivityDialog = () => {
    setIsActivityDialogOpen(false);
    setEditingActivity(null);
  };

  const openSessionDialog = (session?: Session) => {
    setEditingSession(session || null);
    setIsLogSessionOpen(true);
  };

  const closeSessionDialog = () => {
    setIsLogSessionOpen(false);
    setEditingSession(null);
  };

  const handleActivitySave = async (activityData: Partial<Activity>) => {
    editingActivity?.sync_id
      ? await onEditActivity(editingActivity.sync_id, activityData)
      : await onAddActivity(activityData as any);
    closeActivityDialog();
  };

  const handleSessionSave = async (session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => {
    editingSession?.sync_id
      ? await onEditSession(editingSession.sync_id, session)
      : await onAddSession(session);
    closeSessionDialog();
  };

  const handleDeleteActivity = async (syncId: string) => {
    const success = await onDeleteActivity(syncId);
    if (success && selectedActivityId === syncId) {
      onSelectActivity(null);
    }
  };

  const handleDuplicateSession = async (session: Session) => {
    const duration = session.end_time - session.start_time;
    const now = Date.now();
    const duplicatedSession: Omit<Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'> = {
      name: `${session.name} (Copy)`,
      start_time: now,
      end_time: now + duration,
      activity_ids: [...session.activity_ids],
    };
    await onAddSession(duplicatedSession);
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <DashboardHeader
          title={selectedActivity ? selectedActivity.name : 'Dashboard'}
          timePeriod={timePeriod}
          selectedDate={selectedDate}
          onTimePeriodChange={setTimePeriod}
          onDateChange={setSelectedDate}
        />

        {/* Visualization Section */}
        {selectedActivity ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedActivity.color || '#3b82f6' }}
                />
                <h2 className="text-xl sm:text-2xl font-semibold">{selectedActivity.name}</h2>
              </div>
              <Button
                variant="outline"
                onClick={() => openActivityDialog(selectedActivity)}
                className="w-full sm:w-auto"
              >
                Edit Activity
              </Button>
            </div>
            <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
              <h3 className="font-semibold leading-none tracking-tight mb-4">Progress</h3>
              <ProgressBar
                activity={selectedActivity}
                sessions={sessions}
                timePeriod={timePeriod}
                selectedDate={selectedDate}
                showPeriodLabel={true}
              />
            </div>

            {/* Streak Display */}
            {streak && (
              <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
                <h3 className="font-semibold leading-none tracking-tight mb-4 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Streaks
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold" style={{ color: selectedActivity.color }}>
                      {streak.current} {streak.current === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Longest Streak</p>
                    <p className="text-2xl font-bold" style={{ color: selectedActivity.color }}>
                      {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <TrendChart
                activities={activities}
                sessions={sessions}
                selectedActivityId={selectedActivity.sync_id}
                title="Activity Trend"
              />
            </div>
          </div>
        ) : (
          <ActivityGrid
            activities={activities}
            sessions={sessions}
            timePeriod={timePeriod}
            selectedDate={selectedDate}
            onSelectActivity={onSelectActivity}
            onDeleteActivity={handleDeleteActivity}
            onCreateActivity={() => openActivityDialog()}
          />
        )}

        {/* Sessions List Section */}
        <div className="pt-8 border-t">
          <h2 className="text-xl font-bold mb-4">Sessions</h2>
          <SessionList
            sessions={displayedSessions}
            activities={activities}
            onDeleteSession={onDeleteSession}
            onLogSession={() => openSessionDialog()}
            onEditSession={openSessionDialog}
            onDuplicateSession={handleDuplicateSession}
          />
        </div>
      </div>

      {/* Dialogs */}
      <LogSessionDialog
        isOpen={isLogSessionOpen}
        onClose={closeSessionDialog}
        onSave={handleSessionSave}
        activities={activities}
        initialActivityId={selectedActivityId}
        editingSession={editingSession}
      />

      <ActivityDialog
        isOpen={isActivityDialogOpen}
        onClose={closeActivityDialog}
        onSave={handleActivitySave}
        initialData={editingActivity}
      />
    </div>
  );
};
