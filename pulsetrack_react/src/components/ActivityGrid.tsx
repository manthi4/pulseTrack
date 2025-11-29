import { Plus } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { Card } from './ui/Card';
import { type Activity, type Session } from '../lib/db';
import { type TimePeriod } from '../lib/dateUtils';

interface ActivityGridProps {
  activities: Activity[];
  sessions: Session[];
  timePeriod: TimePeriod;
  selectedDate: Date;
  onSelectActivity: (syncId: string) => void;
  onCreateActivity: () => void;
}

export function ActivityGrid({
  activities,
  sessions,
  timePeriod,
  selectedDate,
  onSelectActivity,
  onCreateActivity
}: ActivityGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map(activity => (
        <ActivityCard
          key={activity.sync_id}
          activity={activity}
          sessions={sessions}
          timePeriod={timePeriod}
          selectedDate={selectedDate}
          onSelectActivity={onSelectActivity}
        />
      ))}

      <Card
        padding="sm"
        className="border-2 border-dashed border-muted hover:border-primary bg-card/50 text-muted-foreground hover:text-primary flex flex-col items-center justify-center cursor-pointer h-[260px]"
        onClick={onCreateActivity}
      >
        <Plus className="h-12 w-12 mb-2" />
        <span className="font-medium">Create Activity</span>
      </Card>
    </div>
  );
}
