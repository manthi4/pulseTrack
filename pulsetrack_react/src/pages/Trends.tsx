import React, { useState } from 'react';
import { TrendChart } from '../components/TrendChart';
import { Analytics } from '../components/Analytics';
import { type Activity, type Session } from '../lib/db';
import { type DateRange, type AggregationType } from '../lib/chartUtils';

interface TrendsProps {
  activities: Activity[];
  sessions: Session[];
}

export const Trends: React.FC<TrendsProps> = ({ activities, sessions }) => {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [aggregation, setAggregation] = useState<AggregationType>('daily');

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trends</h1>
        </div>
        
        <TrendChart 
          activities={activities} 
          sessions={sessions} 
          title="Activity Trends"
          dateRange={dateRange}
          aggregation={aggregation}
          onDateRangeChange={setDateRange}
          onAggregationChange={setAggregation}
        />
        
        <Analytics
          activities={activities}
          sessions={sessions}
          dateRange={dateRange}
          aggregation={aggregation}
        />
      </div>
    </div>
  );
};

