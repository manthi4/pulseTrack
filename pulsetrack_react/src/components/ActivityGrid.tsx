import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { DonutChart } from './DonutChart';
import { type Activity, type Session } from '../lib/db';
import { type TimePeriod } from './TimePeriodSelector';

interface ActivityGridProps {
  activities: Activity[];
  sessions: Session[];
  timePeriod: TimePeriod;
  selectedDate: Date;
  onSelectActivity: (id: number) => void;
  onDeleteActivity: (id: number) => void;
  onCreateActivity: () => void;
}

export function ActivityGrid({
  activities,
  sessions,
  timePeriod,
  selectedDate,
  onSelectActivity,
  onDeleteActivity,
  onCreateActivity
}: ActivityGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map(activity => (
        <div 
          key={activity.id} 
          className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-4 relative group cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all hover:border-primary/20"
          onClick={() => onSelectActivity(activity.id!)}
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onDeleteActivity(activity.id!); 
                    }}
                  >
                   <Trash2 className="h-4 w-4 text-destructive" />
                 </Button>
            </div>
            <h3 className="font-semibold text-center mb-2">{activity.name}</h3>
            <div className="h-48">
                 <DonutChart 
                   activity={activity} 
                   sessions={sessions} 
                   timePeriod={timePeriod} 
                   selectedDate={selectedDate}
                   showPeriodLabel={false} 
                 />
            </div>
        </div>
      ))}
      
      <div 
        className="rounded-xl border-2 border-dashed border-muted hover:border-primary bg-card/50 text-muted-foreground hover:text-primary shadow-sm hover:shadow-md hover:shadow-primary/10 p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-[260px]"
        onClick={onCreateActivity}
      >
         <Plus className="h-12 w-12 mb-2" />
         <span className="font-medium">Create Activity</span>
      </div>
    </div>
  );
}

