import React, { useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';

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

  const navigateFunctions = {
    day: { prev: subDays, next: addDays },
    week: { prev: subWeeks, next: addWeeks },
    month: { prev: subMonths, next: addMonths },
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const navFn = navigateFunctions[value]?.[direction];
    if (navFn) {
      onDateChange(navFn(selectedDate, 1));
    }
  };

  const formatPeriodDisplay = (date: Date, period: TimePeriod): string => {
    if (period === 'week') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    const formats: Record<TimePeriod, string> = {
      day: 'MMM d, yyyy',
      month: 'MMMM yyyy',
      week: 'MMM d, yyyy', // fallback
    };
    return format(date, formats[period] || formats.day);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    if (inputDate) {
      let parsedDate: Date;
      if (value === 'month') {
        // For month input, value is "yyyy-MM"
        const [year, month] = inputDate.split('-').map(Number);
        parsedDate = new Date(year, month - 1, 1);
      } else {
        // For date input, value is "yyyy-MM-dd"
        const [year, month, day] = inputDate.split('-').map(Number);
        parsedDate = new Date(year, month - 1, day);
      }
      onDateChange(parsedDate);
    }
  };

  const getDateInputValue = (date: Date, period: TimePeriod): string => {
    const formats: Record<TimePeriod, (d: Date) => string> = {
      day: (d) => format(d, 'yyyy-MM-dd'),
      week: (d) => format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      month: (d) => format(startOfMonth(d), 'yyyy-MM'),
    };
    return formats[period]?.(date) || formats.day(date);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDateDisplayClick = () => {
    inputRef.current?.showPicker?.() || inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      <div className="inline-flex rounded-lg border border-input bg-background p-1 w-full sm:w-auto">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant="ghost"
            size="sm"
            onClick={() => onChange(period.value)}
            className={cn(
              'px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-initial',
              value === period.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {period.label}
          </Button>
        ))}
      </div>
      
      <div className="flex items-center gap-2 border border-input rounded-lg bg-background overflow-hidden w-full sm:w-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigatePeriod('prev')}
          className="h-8 w-8 p-0 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div 
          className="relative flex-1 min-w-0 sm:min-w-[160px] h-8 flex items-center px-2 sm:px-3 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={handleDateDisplayClick}
        >
          <span className="text-xs sm:text-sm select-none pointer-events-none truncate">
            {formatPeriodDisplay(selectedDate, value)}
          </span>
          <Input
            ref={inputRef}
            type={value === 'month' ? 'month' : 'date'}
            value={getDateInputValue(selectedDate, value)}
            onChange={handleDateInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ fontSize: '16px' }}
          />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigatePeriod('next')}
          className="h-8 w-8 p-0 shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

