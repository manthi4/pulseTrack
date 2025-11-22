import React, { useState, useEffect } from 'react';
import { createActivity } from '../lib/db';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';

interface CreateActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated: () => void;
}

export const CreateActivityDialog: React.FC<CreateActivityDialogProps> = ({
  isOpen,
  onClose,
  onActivityCreated,
}) => {
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityGoal, setNewActivityGoal] = useState(0);
  const [newActivityScale, setNewActivityScale] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
    if (isOpen) {
      setNewActivityName('');
      setNewActivityGoal(0);
      setNewActivityScale('daily');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newActivityName.trim()) return;
    
    await createActivity({
      name: newActivityName,
      goal: newActivityGoal,
      goal_scale: newActivityScale,
    });
    
    onActivityCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl border border-border/50 text-card-foreground">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create New Activity</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Activity Name</label>
            <Input
              placeholder="e.g. Coding"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Goal (Hours)</label>
              <Input
                type="number"
                placeholder="Goal"
                value={newActivityGoal}
                onChange={(e) => setNewActivityGoal(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newActivityScale}
                onChange={(e) => setNewActivityScale(e.target.value as any)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleCreate}>Create Activity</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

