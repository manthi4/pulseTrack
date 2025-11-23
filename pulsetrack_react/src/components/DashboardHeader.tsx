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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-4 w-full sm:w-auto">
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

