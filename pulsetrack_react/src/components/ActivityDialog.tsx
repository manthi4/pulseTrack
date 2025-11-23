import React, { useState, useEffect } from 'react';
import { type Activity } from '../lib/db';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';

interface ActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Omit<Activity, 'id' | 'created_at'>>) => Promise<void>;
  initialData?: Activity | null;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
];

export const ActivityDialog: React.FC<ActivityDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(0);
  const [scale, setScale] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (initialData) {
      setName(initialData.name);
      setGoal(initialData.goal);
      setScale(initialData.goal_scale);
      setColor(initialData.color || DEFAULT_COLORS[0]);
    } else {
      setName('');
      setGoal(0);
      setScale('daily');
      setColor(DEFAULT_COLORS[0]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    
    await onSave({
      name,
      goal,
      goal_scale: scale,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-4 sm:p-6 shadow-xl border border-border/50 text-card-foreground max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Activity' : 'Create New Activity'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Activity Name</label>
            <Input
              placeholder="e.g. Coding"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Goal (Hours)</label>
              <Input
                type="number"
                placeholder="Goal"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={scale}
                onChange={(e) => setScale(e.target.value as any)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-md border-2 transition-all hover:scale-110 ${
                    color === c
                      ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-ring'
                      : 'border-border hover:border-foreground/50'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              {initialData ? 'Update Activity' : 'Create Activity'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

