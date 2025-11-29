import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type Activity, type Session } from '../lib/db';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';
import { BarChart3, TrendingUp } from 'lucide-react';
import { calculatePeriodGoal, normalizePeriod } from '../lib/dateUtils';
import { getDateRange, prepareChartData, calculateStats, type DateRange, type AggregationType } from '../lib/chartUtils';

interface TrendChartProps {
  activities: Activity[];
  sessions: Session[];
  selectedActivityId?: string;
  title?: string;
  className?: string;
  dateRange?: DateRange;
  aggregation?: AggregationType;
  onDateRangeChange?: (range: DateRange) => void;
  onAggregationChange?: (agg: AggregationType) => void;
}

type ChartType = 'line' | 'area';

export const TrendChart: React.FC<TrendChartProps> = ({ 
  activities, 
  sessions, 
  selectedActivityId,
  title = "Trends",
  className,
  dateRange: externalDateRange,
  aggregation: externalAggregation,
  onDateRangeChange,
  onAggregationChange
}) => {
  const [internalDateRange, setInternalDateRange] = useState<DateRange>('30');
  const [internalAggregation, setInternalAggregation] = useState<AggregationType>('daily');
  const [chartType, setChartType] = useState<ChartType>('line');
  
  const dateRange = externalDateRange ?? internalDateRange;
  const aggregation = externalAggregation ?? internalAggregation;
  
  const setDateRange = (range: DateRange) => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    } else {
      setInternalDateRange(range);
    }
  };
  
  const setAggregation = (agg: AggregationType) => {
    if (onAggregationChange) {
      onAggregationChange(agg);
    } else {
      setInternalAggregation(agg);
    }
  };
  
  const initialSelected = useMemo(() => {
    if (selectedActivityId) return new Set([selectedActivityId]);
    return new Set(activities.map(a => a.sync_id).filter((id): id is string => id !== undefined));
  }, [selectedActivityId, activities]);

  const [visibleActivities, setVisibleActivities] = useState<Set<string>>(initialSelected);

  useEffect(() => {
    if (selectedActivityId) {
      setVisibleActivities(new Set([selectedActivityId]));
    }
  }, [selectedActivityId]);

  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);
  
  const chartData = useMemo(() => 
    prepareChartData(activities, sessions, aggregation, startDate, endDate), 
    [activities, sessions, aggregation, startDate, endDate]
  );

  const activityStats = useMemo(() => 
    calculateStats(activities, chartData, aggregation), 
    [activities, chartData, aggregation]
  );

  const toggleActivity = (activitySyncId: string) => {
    const newSet = new Set(visibleActivities);
    if (newSet.has(activitySyncId)) newSet.delete(activitySyncId);
    else newSet.add(activitySyncId);
    setVisibleActivities(newSet);
  };

  const ChartComponent = chartType === 'line' ? LineChart : AreaChart;
  const DataComponent = chartType === 'line' ? Line : Area;

  const displayedActivities = activities.filter(a => 
    a.sync_id && visibleActivities.has(a.sync_id)
  );

  const statsToDisplay = selectedActivityId 
    ? activityStats.find(s => s.activityId === selectedActivityId)
    : null;

  const formatTooltip = (value: number, name: string, props: any) => {
    const activitySyncId = name.replace('activity_', '');
    const activity = activities.find(a => a.sync_id === activitySyncId);
    const stats = activityStats.find(s => s.activityId === activitySyncId);
    
    let periodGoal = stats?.currentGoal || 0;
    if (activity && props.payload?.periodStart && props.payload?.periodEnd) {
      const periodStart = new Date(props.payload.periodStart);
      const periodEnd = new Date(props.payload.periodEnd);
      periodGoal = Number(calculatePeriodGoal(
        activity.goal,
        activity.goal_scale,
        normalizePeriod(aggregation),
        periodStart,
        periodEnd
      ).toFixed(2));
    }

    const percentage = periodGoal > 0 ? ((value / periodGoal) * 100).toFixed(0) : '0';
    return [`${value.toFixed(2)}h (${percentage}%)`, activity?.name || name];
  };

  return (
    <Card className={className}>
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold leading-none tracking-tight text-xl">{title}</h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-input bg-background p-0.5">
              {(['7', '30', '90'] as DateRange[]).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(range)}
                  className={cn('px-2 py-0.5 text-xs h-7', dateRange === range ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                >
                  {range}d
                </Button>
              ))}
            </div>

            <div className="inline-flex rounded-md border border-input bg-background p-0.5">
              {(['daily', 'weekly', 'monthly'] as AggregationType[]).map((agg) => (
                <Button
                  key={agg}
                  variant="ghost"
                  size="sm"
                  onClick={() => setAggregation(agg)}
                  className={cn('px-2x py-0.5 text-xs h-7 capitalize', aggregation === agg ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                >
                  {agg.slice(0, 3)}
                </Button>
              ))}
            </div>

            <div className="inline-flex rounded-md border border-input bg-background p-0.5">
               <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('line')}
                className={cn('px-2 py-0.5 text-xs h-7', chartType === 'line' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
              >
                <TrendingUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('area')}
                className={cn('px-2 py-0.5 text-xs h-7', chartType === 'area' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
              >
                <BarChart3 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {statsToDisplay && statsToDisplay.currentGoal > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4 p-3 bg-muted/30 rounded-lg">
            <div><div className="text-muted-foreground">Avg</div><div className="font-semibold">{statsToDisplay.average}h</div></div>
            <div><div className="text-muted-foreground">Total</div><div className="font-semibold">{statsToDisplay.total}h</div></div>
            <div><div className="text-muted-foreground">Max</div><div className="font-semibold">{statsToDisplay.max}h</div></div>
            <div><div className="text-muted-foreground">Goal</div><div className="font-semibold">{statsToDisplay.currentGoal}h</div></div>
          </div>
        )}

        {!selectedActivityId && activities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activities.map((activity) => {
               if (!activity.sync_id) return null;
               const isSelected = visibleActivities.has(activity.sync_id);
               const color = activity.color || '#3b82f6';
               return (
                 <button
                   key={activity.sync_id}
                   onClick={() => toggleActivity(activity.sync_id!)}
                   className={cn(
                     "px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border",
                     isSelected ? "bg-primary/10 border-primary/20 text-foreground" : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                   )}
                 >
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? color : '#9ca3af' }} />
                   {activity.name}
                 </button>
               );
            })}
          </div>
        )}
      </div>
      
      {displayedActivities.length > 0 ? (
        <div className="h-72 overflow-x-auto scrollbar-hide">
          <div style={{ minWidth: Math.max(600, chartData.length * 60) }}>
            <ResponsiveContainer width="100%" height={288}>
              <ChartComponent data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  angle={aggregation === 'daily' ? -45 : 0}
                  textAnchor={aggregation === 'daily' ? 'end' : 'middle'}
                  height={aggregation === 'daily' ? 50 : 30}
                  tickLine={false}
                  axisLine={false}
                />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ padding: 0 }}
                labelStyle={{ color: 'hsl(var(--foreground))', marginBottom: '0.5rem', fontWeight: 600 }}
                formatter={formatTooltip}
              />
              {!selectedActivityId && <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />}
              
              {displayedActivities.map((activity) => {
                if (!activity.sync_id) return null;
                const dataKey = `activity_${activity.sync_id}`;
                const color = activity.color || '#3b82f6';
                const stats = activityStats.find(s => s.activityId === activity.sync_id);
                
                return (
                  <React.Fragment key={activity.sync_id}>
                    {selectedActivityId && stats && stats.currentGoal > 0 && (
                      <ReferenceLine 
                        y={stats.currentGoal} 
                        stroke={color} 
                        strokeDasharray="3 3" 
                        strokeOpacity={0.5}
                        label={{ value: 'Goal', position: 'right', fill: color, fontSize: 10 }}
                      />
                    )}
                    <DataComponent
                      type="monotone"
                      dataKey={dataKey}
                      stroke={color}
                      fill={color}
                      fillOpacity={chartType === 'area' ? 0.2 : 0}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      name={activity.name}
                    />
                  </React.Fragment>
                );
              })}
            </ChartComponent>
          </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
          No data to display
        </div>
      )}
    </Card>
  );
};
