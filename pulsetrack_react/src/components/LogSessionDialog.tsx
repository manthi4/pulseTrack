import React, { useState, useEffect } from 'react';
import { type Activity, type Session } from '../lib/db';
import { formatDateTimeLocal } from '../lib/dateUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';

interface LogSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Omit<Session, 'id'>) => void;
  activities: Activity[];
  initialActivityId?: number | null;
  editingSession?: Session | null;
  initialStartTime?: number | null;
  initialEndTime?: number | null;
  initialName?: string;
}

export const LogSessionDialog: React.FC<LogSessionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  activities,
  initialActivityId,
  editingSession,
  initialStartTime,
  initialEndTime,
  initialName,
}) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingSession) {
      setName(editingSession.name);
      setStartTime(formatDateTimeLocal(new Date(editingSession.start_time)));
      setEndTime(formatDateTimeLocal(new Date(editingSession.end_time)));
      setSelectedActivityIds(editingSession.activity_ids);
    } else if (initialStartTime && initialEndTime) {
      // Pre-fill with timer data
      setName(initialName || '');
      setStartTime(formatDateTimeLocal(new Date(initialStartTime)));
      setEndTime(formatDateTimeLocal(new Date(initialEndTime)));
      setSelectedActivityIds(initialActivityId ? [initialActivityId] : []);
    } else {
      setName('');
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      setEndTime(formatDateTimeLocal(now));
      setStartTime(formatDateTimeLocal(oneHourAgo));
      setSelectedActivityIds(initialActivityId ? [initialActivityId] : []);
    }
  }, [isOpen, initialActivityId, editingSession, initialStartTime, initialEndTime, initialName]);

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

    onSave({ name, start_time: start, end_time: end, activity_ids: selectedActivityIds });
    onClose();
  };

  const toggleActivity = (id: number) => {
    setSelectedActivityIds(prev => 
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-4 sm:p-6 shadow-xl border border-border/50 text-card-foreground max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{editingSession ? 'Edit Session' : 'Log Session'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Session Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Jog" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {activities.map(activity => {
                const color = activity.color || '#3b82f6';
                const isSelected = activity.id && selectedActivityIds.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    onClick={() => activity.id && toggleActivity(activity.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isSelected ? color : `${color}15`,
                      borderColor: isSelected ? color : `${color}40`,
                      color: isSelected ? 'white' : color,
                    }}
                  >
                    {activity.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">{editingSession ? 'Update Session' : 'Save Session'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

