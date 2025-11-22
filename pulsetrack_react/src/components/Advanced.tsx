import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from './ui/Button';
import { type Activity, type Session } from '../lib/db';

interface AdvancedProps {
  activities: Activity[];
  sessions: Session[];
}

export const Advanced: React.FC<AdvancedProps> = ({ activities, sessions }) => {
  const convertToCSV = (data: any[], headers: string[]): string => {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle arrays and special characters
        if (Array.isArray(value)) {
          return `"${value.join(';')}"`;
        }
        if (value === null || value === undefined) {
          return '';
        }
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const exportActivities = () => {
    const headers = ['id', 'name', 'goal', 'goal_scale', 'created_at'];
    const csv = convertToCSV(activities, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pulsetrack-activities-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSessions = () => {
    const headers = ['id', 'name', 'start_time', 'end_time', 'activity_ids'];
    const csv = convertToCSV(sessions, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pulsetrack-sessions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAll = () => {
    // Combine activities and sessions into a single export
    const allData = [
      ...activities.map(a => ({ type: 'activity', ...a })),
      ...sessions.map(s => ({ type: 'session', ...s }))
    ];
    
    // Get all unique headers
    const allHeaders = new Set<string>(['type']);
    activities.forEach(a => Object.keys(a).forEach(k => allHeaders.add(k)));
    sessions.forEach(s => Object.keys(s).forEach(k => allHeaders.add(k)));
    
    const headers = Array.from(allHeaders);
    const csv = convertToCSV(allData, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pulsetrack-all-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced</h1>
          <p className="text-muted-foreground">
            Export your PulseTrack data as CSV files for backup or analysis.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Activities Export */}
          <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold leading-none tracking-tight">Activities</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
            </div>
            <Button
              onClick={exportActivities}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Activities
            </Button>
          </div>

          {/* Sessions Export */}
          <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold leading-none tracking-tight">Sessions</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
                </p>
              </div>
            </div>
            <Button
              onClick={exportSessions}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Sessions
            </Button>
          </div>

          {/* All Data Export */}
          <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold leading-none tracking-tight">All Data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete export
                </p>
              </div>
            </div>
            <Button
              onClick={exportAll}
              className="w-full"
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
          <h3 className="font-semibold mb-4">Export Information</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>Activities CSV</strong> includes: id, name, goal, goal_scale, created_at
            </p>
            <p>
              • <strong>Sessions CSV</strong> includes: id, name, start_time, end_time, activity_ids
            </p>
            <p>
              • <strong>All Data CSV</strong> combines both activities and sessions with a 'type' column to distinguish them
            </p>
            <p>
              • Timestamps are exported as Unix timestamps (milliseconds since epoch)
            </p>
            <p>
              • Activity IDs in sessions are separated by semicolons (;) in the CSV
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

