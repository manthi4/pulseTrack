import React from 'react';
import { type Session, type Activity } from '../lib/db';
import { format } from 'date-fns';
import { Trash2, Clock, Plus } from 'lucide-react';
import { Button } from './ui/Button';

interface SessionListProps {
  sessions: Session[];
  activities: Activity[];
  onDeleteSession: (id: number) => void;
  onLogSession: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({ 
  sessions, 
  activities, 
  onDeleteSession,
  onLogSession 
}) => {
  
  const getActivityName = (id: number) => {
    return activities.find(a => a.id === id)?.name || 'Unknown';
  };

  const formatDuration = (start: number, end: number) => {
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div 
          onClick={onLogSession}
          className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted hover:border-primary bg-card/50 text-muted-foreground hover:text-primary cursor-pointer transition-all hover:shadow-md hover:shadow-primary/10 group"
        >
            <div className="flex items-center gap-2 font-medium">
                <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Log Session</span>
            </div>
        </div>

        {sessions.length === 0 && (
          <div className="text-muted-foreground text-center py-8">No sessions logged yet.</div>
        )}

        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="space-y-1">
              <div className="font-semibold flex items-center gap-2">
                {session.name}
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                   <Clock className="h-3 w-3" /> {formatDuration(session.start_time, session.end_time)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(session.start_time, 'PP p')}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {session.activity_ids.map(id => (
                  <span key={id} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
                    {getActivityName(id)}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => session.id && onDeleteSession(session.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
