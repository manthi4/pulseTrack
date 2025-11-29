import React, { useState, useEffect } from 'react';
import { type Activity, type Session } from '../lib/db';
import { formatDateTimeLocal } from '../lib/dateUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog } from './ui/Dialog';
import { FormField } from './ui/FormField';
import { ActivityBadge } from './ui/ActivityBadge';

interface LogSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Omit<Session, 'sync_id' | 'id' | 'updated_at' | 'deleted_at'>) => void;
  activities: Activity[];
  initialActivityId?: string | null;
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
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

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

  const toggleActivity = (syncId: string) => {
    setSelectedActivityIds(prev =>
      prev.includes(syncId) ? prev.filter(aid => aid !== syncId) : [...prev, syncId]
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingSession ? 'Edit Session' : 'Log Session'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            {editingSession ? 'Update Session' : 'Save Session'}
          </Button>
        </>
      }
    >
      <FormField label="Session Name" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning Jog"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Start Time" required>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </FormField>
        <FormField label="End Time" required>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Activities" required>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
          {activities.map(activity => {
            const isSelected = activity.sync_id && selectedActivityIds.includes(activity.sync_id);
            return (
              <ActivityBadge
                key={activity.sync_id}
                name={activity.name}
                color={activity.color}
                isSelected={!!isSelected}
                onClick={() => activity.sync_id && toggleActivity(activity.sync_id)}
                size="md"
              />
            );
          })}
        </div>
      </FormField>
    </Dialog>
  );
};

