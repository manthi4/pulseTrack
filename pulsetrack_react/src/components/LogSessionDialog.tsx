import React, { useState, useEffect } from 'react';
import { type Activity, type Session } from '../lib/db';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';

interface LogSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Omit<Session, 'id'>) => void;
  activities: Activity[];
  initialActivityId?: number | null;
}

export const LogSessionDialog: React.FC<LogSessionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  activities,
  initialActivityId,
}) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      // Default to now for end, now-1h for start
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      // Format for datetime-local input: YYYY-MM-DDTHH:mm
      const formatDateTimeLocal = (date: Date) => {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };
      
      setEndTime(formatDateTimeLocal(now));
      setStartTime(formatDateTimeLocal(oneHourAgo));
      
      if (initialActivityId) {
        setSelectedActivityIds([initialActivityId]);
      } else {
        setSelectedActivityIds([]);
      }
    }
  }, [isOpen, initialActivityId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name || !startTime || !endTime || selectedActivityIds.length === 0) {
      alert("Please fill in all fields and select at least one activity.");
      return;
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (end <= start) {
      alert("End time must be after start time.");
      return;
    }

    onSave({
      name,
      start_time: start,
      end_time: end,
      activity_ids: selectedActivityIds,
    });
    onClose();
  };

  const toggleActivity = (id: number) => {
    setSelectedActivityIds(prev => 
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border border-border/50 text-card-foreground">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Log Session</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Session Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Jog" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <Input 
                type="datetime-local" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Time</label>
              <Input 
                type="datetime-local" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Activities</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
              {activities.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => activity.id && toggleActivity(activity.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    activity.id && selectedActivityIds.includes(activity.id)
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                      : 'bg-secondary text-secondary-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {activity.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Session</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

