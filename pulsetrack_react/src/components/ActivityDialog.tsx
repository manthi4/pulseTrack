import React, { useState, useEffect } from 'react';
import { type Activity } from '../lib/db';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog } from './ui/Dialog';
import { Select } from './ui/Select';
import { ColorPicker, DEFAULT_COLORS } from './ui/ColorPicker';
import { FormField } from './ui/FormField';

interface ActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Omit<Activity, 'id' | 'created_at'>>) => Promise<void>;
  initialData?: Activity | null;
}

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
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Activity' : 'Create New Activity'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            {initialData ? 'Update Activity' : 'Create Activity'}
          </Button>
        </>
      }
    >
      <FormField label="Activity Name" required>
        <Input
          placeholder="e.g. Coding"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Goal (Hours)">
          <Input
            type="number"
            placeholder="Goal"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </FormField>
        <FormField label="Frequency">
          <Select
            value={scale}
            onChange={(e) => setScale(e.target.value as any)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Accent Color">
        <ColorPicker
          value={color}
          onChange={setColor}
          colors={DEFAULT_COLORS}
          size="sm"
        />
      </FormField>
    </Dialog>
  );
};

