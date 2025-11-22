import React, { useMemo, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type Activity, type Session } from '../lib/db';
import { startOfDay, format, eachDayOfInterval, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { LayoutGrid, BarChart3, TrendingUp } from 'lucide-react';

interface TrendsProps {
  activities: Activity[];
  sessions: Session[];
}

type DateRange = '7' | '30' | '90' | 'custom';
type AggregationType = 'daily' | 'weekly' | 'monthly';
type ChartType = 'line' | 'area';
type ViewMode = 'individual' | 'combined';

interface ActivityStats {
  activityId: number;
  average: number;
  total: number;
  max: number;
  min: number;
  currentGoal: number;
}

export const Trends: React.FC<TrendsProps> = ({ activities, sessions }) => {
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [aggregation, setAggregation] = useState<AggregationType>('daily');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(
    new Set(activities.map(a => a.id!).filter(id => id !== undefined))
  );

  // Generate colors for each activity
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start: Date;
    
    switch (dateRange) {
      case '7':
        start = subDays(end, 6);
        break;
      case '30':
        start = subDays(end, 29);
        break;
      case '90':
        start = subDays(end, 89);
        break;
      default:
        start = subDays(end, 29);
    }
    
    return { startDate: start, endDate: end };
  }, [dateRange]);

  // Calculate chart data based on aggregation type
  const chartData = useMemo(() => {
    let intervals: Date[];
    
    switch (aggregation) {
      case 'daily':
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case 'weekly':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
        break;
      case 'monthly':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        break;
      default:
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    const aggregatedData = intervals.map(interval => {
      let periodStart: Date;
      let periodEnd: Date;
      let dateLabel: string;
      
      switch (aggregation) {
        case 'daily':
          periodStart = startOfDay(interval);
          periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          dateLabel = format(interval, 'MMM dd');
          break;
        case 'weekly':
          periodStart = startOfWeek(interval, { weekStartsOn: 1 });
          periodEnd = endOfWeek(interval, { weekStartsOn: 1 });
          dateLabel = `Week ${format(periodStart, 'MMM dd')}`;
          break;
        case 'monthly':
          periodStart = startOfMonth(interval);
          periodEnd = endOfMonth(interval);
          dateLabel = format(interval, 'MMM yyyy');
          break;
        default:
          periodStart = startOfDay(interval);
          periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          dateLabel = format(interval, 'MMM dd');
      }

      const periodStartTime = periodStart.getTime();
      const periodEndTime = periodEnd.getTime();

      // Calculate time spent per activity for this period
      const activityTimes: Record<number, number> = {};
      
      sessions.forEach(session => {
        const sessionStart = session.start_time;
        const sessionEnd = session.end_time;
        
        // Check if session overlaps with this period
        if (sessionEnd >= periodStartTime && sessionStart <= periodEndTime) {
          // Calculate overlap duration
          const overlapStart = Math.max(sessionStart, periodStartTime);
          const overlapEnd = Math.min(sessionEnd, periodEndTime);
          const overlapDuration = overlapEnd - overlapStart;
          
          // Distribute time across activities for this session
          session.activity_ids.forEach(activityId => {
            if (!activityTimes[activityId]) {
              activityTimes[activityId] = 0;
            }
            // If session has multiple activities, divide time equally
            activityTimes[activityId] += overlapDuration / session.activity_ids.length;
          });
        }
      });

      // Convert to hours and create data point
      const dataPoint: Record<string, string | number> = {
        date: dateLabel,
        fullDate: format(interval, 'yyyy-MM-dd'),
        periodStart: periodStartTime,
      };

      activities.forEach(activity => {
        if (activity.id !== undefined) {
          const hours = (activityTimes[activity.id] || 0) / (1000 * 60 * 60);
          dataPoint[`activity_${activity.id}`] = Number(hours.toFixed(2));
        }
      });

      return dataPoint;
    });

    return aggregatedData;
  }, [activities, sessions, startDate, endDate, aggregation]);

  // Calculate statistics for each activity
  const activityStats = useMemo(() => {
    const stats: ActivityStats[] = [];
    
    activities.forEach(activity => {
      if (activity.id === undefined) return;
      
      const dataKey = `activity_${activity.id}`;
      const values = chartData.map(point => point[dataKey] as number).filter(v => v > 0);
      
      if (values.length === 0) {
        stats.push({
          activityId: activity.id,
          average: 0,
          total: 0,
          max: 0,
          min: 0,
          currentGoal: activity.goal,
        });
        return;
      }
      
      const total = values.reduce((sum, v) => sum + v, 0);
      const average = total / chartData.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      // Calculate daily goal (convert goal_scale to daily equivalent)
      let dailyGoal = activity.goal;
      switch (activity.goal_scale) {
        case 'weekly':
          dailyGoal = activity.goal / 7;
          break;
        case 'monthly':
          dailyGoal = activity.goal / 30;
          break;
        case 'yearly':
          dailyGoal = activity.goal / 365;
          break;
        default:
          dailyGoal = activity.goal;
      }
      
      stats.push({
        activityId: activity.id,
        average: Number(average.toFixed(2)),
        total: Number(total.toFixed(2)),
        max: Number(max.toFixed(2)),
        min: Number(min.toFixed(2)),
        currentGoal: Number(dailyGoal.toFixed(2)),
      });
    });
    
    return stats;
  }, [activities, chartData]);

  const toggleActivity = (activityId: number) => {
    const newSet = new Set(selectedActivities);
    if (newSet.has(activityId)) {
      newSet.delete(activityId);
    } else {
      newSet.add(activityId);
    }
    setSelectedActivities(newSet);
  };

  const ChartComponent = chartType === 'line' ? LineChart : AreaChart;
  const DataComponent = chartType === 'line' ? Line : Area;

  // Combined view - all activities on one chart
  const renderCombinedChart = () => {
    const visibleActivities = activities.filter(a => 
      a.id !== undefined && selectedActivities.has(a.id)
    );

    if (visibleActivities.length === 0) {
      return (
        <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-8 text-center">
          <p className="text-muted-foreground">Select at least one activity to display.</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">All Activities</h3>
          <div className="flex flex-wrap gap-2">
            {activities.map((activity, index) => {
              if (activity.id === undefined) return null;
              const isSelected = selectedActivities.has(activity.id);
              const color = colors[index % colors.length];
              
              return (
                <button
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id!)}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: isSelected ? 'white' : color }}
                  />
                  {activity.name}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                angle={aggregation === 'daily' ? -45 : 0}
                textAnchor={aggregation === 'daily' ? 'end' : 'middle'}
                height={aggregation === 'daily' ? 60 : 30}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ 
                  value: 'Hours', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  const activityId = parseInt(name.replace('activity_', ''));
                  const activity = activities.find(a => a.id === activityId);
                  const stats = activityStats.find(s => s.activityId === activityId);
                  const percentage = stats && stats.currentGoal > 0 
                    ? ((value / stats.currentGoal) * 100).toFixed(0)
                    : '0';
                  return [`${value.toFixed(2)}h (${percentage}% of goal)`, activity?.name || name];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value: string) => {
                  const activityId = parseInt(value.replace('activity_', ''));
                  return activities.find(a => a.id === activityId)?.name || value;
                }}
              />
              {visibleActivities.map((activity, index) => {
                if (activity.id === undefined) return null;
                const dataKey = `activity_${activity.id}`;
                const color = colors[index % colors.length];
                const stats = activityStats.find(s => s.activityId === activity.id);
                
                return (
                  <React.Fragment key={activity.id}>
                    {stats && stats.currentGoal > 0 && (
                      <ReferenceLine 
                        y={stats.currentGoal} 
                        stroke={color} 
                        strokeDasharray="5 5" 
                        strokeOpacity={0.5}
                        label={{ value: `${activity.name} goal`, position: 'right', fill: color }}
                      />
                    )}
                    <DataComponent
                      type="monotone"
                      dataKey={dataKey}
                      stroke={color}
                      fill={color}
                      fillOpacity={chartType === 'area' ? 0.3 : 0}
                      strokeWidth={2}
                      dot={{ fill: color, r: 3 }}
                      activeDot={{ r: 5 }}
                      name={`activity_${activity.id}`}
                      hide={!selectedActivities.has(activity.id)}
                    />
                  </React.Fragment>
                );
              })}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Individual view - one chart per activity
  const renderIndividualCharts = () => {
    return (
      <div className="space-y-8">
        {activities.map((activity, index) => {
          if (activity.id === undefined) return null;
          
          const dataKey = `activity_${activity.id}`;
          const color = colors[index % colors.length];
          const stats = activityStats.find(s => s.activityId === activity.id);
          
          const activityData = chartData.map(point => ({
            date: point.date,
            fullDate: point.fullDate,
            value: point[dataKey] as number,
          }));

          return (
            <div
              key={activity.id}
              className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">{activity.name}</h3>
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Average</div>
                      <div className="font-semibold">{stats.average}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-semibold">{stats.total}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Max</div>
                      <div className="font-semibold">{stats.max}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min</div>
                      <div className="font-semibold">{stats.min}h</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ChartComponent data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      angle={aggregation === 'daily' ? -45 : 0}
                      textAnchor={aggregation === 'daily' ? 'end' : 'middle'}
                      height={aggregation === 'daily' ? 60 : 30}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{ 
                        value: 'Hours', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: 'hsl(var(--muted-foreground))'
                      }}
                    />
                    {stats && stats.currentGoal > 0 && (
                      <ReferenceLine 
                        y={stats.currentGoal} 
                        stroke={color} 
                        strokeDasharray="5 5" 
                        strokeOpacity={0.7}
                        label={{ 
                          value: `Goal: ${stats.currentGoal}h`, 
                          position: 'right',
                          fill: color,
                          fontSize: 12
                        }}
                      />
                    )}
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => {
                        const percentage = stats && stats.currentGoal > 0 
                          ? ((value / stats.currentGoal) * 100).toFixed(0)
                          : '0';
                        return [`${value.toFixed(2)}h (${percentage}% of goal)`, 'Time'];
                      }}
                    />
                    <DataComponent
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      fill={color}
                      fillOpacity={chartType === 'area' ? 0.3 : 0}
                      strokeWidth={2}
                      dot={{ fill: color, r: 3 }}
                      activeDot={{ r: 5 }}
                      name={activity.name}
                    />
                  </ChartComponent>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border/50 bg-card">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Date Range:</span>
            <div className="inline-flex rounded-lg border border-input bg-background p-1">
              {(['7', '30', '90'] as DateRange[]).map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'px-3 py-1 text-xs',
                    dateRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  {range} days
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Aggregation:</span>
            <div className="inline-flex rounded-lg border border-input bg-background p-1">
              {(['daily', 'weekly', 'monthly'] as AggregationType[]).map((agg) => (
                <Button
                  key={agg}
                  variant="ghost"
                  size="sm"
                  onClick={() => setAggregation(agg)}
                  className={cn(
                    'px-3 py-1 text-xs capitalize',
                    aggregation === agg
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  {agg}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Chart Type:</span>
            <div className="inline-flex rounded-lg border border-input bg-background p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('line')}
                className={cn(
                  'px-3 py-1 text-xs',
                  chartType === 'line'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                title="Line Chart"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('area')}
                className={cn(
                  'px-3 py-1 text-xs',
                  chartType === 'area'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                title="Area Chart"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">View:</span>
            <div className="inline-flex rounded-lg border border-input bg-background p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('individual')}
                className={cn(
                  'px-3 py-1 text-xs',
                  viewMode === 'individual'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                title="Individual Charts"
              >
                Individual
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('combined')}
                className={cn(
                  'px-3 py-1 text-xs',
                  viewMode === 'combined'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                title="Combined Chart"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Charts */}
        {activities.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-8 text-center">
            <p className="text-muted-foreground">No activities found. Create an activity to see trends.</p>
          </div>
        ) : viewMode === 'combined' ? (
          renderCombinedChart()
        ) : (
          renderIndividualCharts()
        )}
      </div>
    </div>
  );
};
