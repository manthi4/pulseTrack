import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';

export type TimePeriod = 'day' | 'week' | 'month';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  selectedDate: Date;
  onChange: (period: TimePeriod) => void;
  onDateChange: (date: Date) => void;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({ 
  value, 
  selectedDate, 
  onChange, 
  onDateChange 
}) => {
  const periods: { label: string; value: TimePeriod }[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  const navigatePeriod = (direction: 'prev' | 'next') => {
    let newDate: Date;
    if (direction === 'prev') {
      switch (value) {
        case 'day':
          newDate = subDays(selectedDate, 1);
          break;
        case 'week':
          newDate = subWeeks(selectedDate, 1);
          break;
        case 'month':
          newDate = subMonths(selectedDate, 1);
          break;
        default:
          newDate = selectedDate;
      }
    } else {
      switch (value) {
        case 'day':
          newDate = addDays(selectedDate, 1);
          break;
        case 'week':
          newDate = addWeeks(selectedDate, 1);
          break;
        case 'month':
          newDate = addMonths(selectedDate, 1);
          break;
        default:
          newDate = selectedDate;
      }
    }
    onDateChange(newDate);
  };

  const formatPeriodDisplay = (date: Date, period: TimePeriod): string => {
    switch (period) {
      case 'day':
        return format(date, 'MMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(date, 'MMMM yyyy');
      default:
        return format(date, 'MMM d, yyyy');
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    if (inputDate) {
      onDateChange(new Date(inputDate));
    }
  };

  const getDateInputValue = (date: Date, period: TimePeriod): string => {
    switch (period) {
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      case 'month':
        return format(startOfMonth(date), 'yyyy-MM');
      default:
        return format(date, 'yyyy-MM-dd');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex rounded-lg border border-input bg-background p-1">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant="ghost"
            size="sm"
            onClick={() => onChange(period.value)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium transition-all',
              value === period.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {period.label}
          </Button>
        ))}
      </div>
      
      <div className="flex items-center gap-2 border border-input rounded-lg bg-background px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigatePeriod('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Input
            type={value === 'month' ? 'month' : 'date'}
            value={getDateInputValue(selectedDate, value)}
            onChange={handleDateInputChange}
            className="h-8 w-auto px-2 text-sm border-0 focus-visible:ring-0"
          />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigatePeriod('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

