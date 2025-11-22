import { TimePeriodSelector, type TimePeriod } from './TimePeriodSelector';

interface DashboardHeaderProps {
  title: string;
  timePeriod: TimePeriod;
  selectedDate: Date;
  onTimePeriodChange: (period: TimePeriod) => void;
  onDateChange: (date: Date) => void;
}

export function DashboardHeader({
  title,
  timePeriod,
  selectedDate,
  onTimePeriodChange,
  onDateChange
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        <TimePeriodSelector 
          value={timePeriod} 
          selectedDate={selectedDate}
          onChange={onTimePeriodChange}
          onDateChange={onDateChange}
        />
      </div>
    </div>
  );
}

