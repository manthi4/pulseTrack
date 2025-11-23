import React, { useState, useRef } from 'react';
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { type Activity, type Session, createActivity, createSession } from '../lib/db';

interface AdvancedProps {
  activities: Activity[];
  sessions: Session[];
  refreshData: () => Promise<void>;
}

const convertToCSV = (data: any[], headers: string[]): string => {
  const escapeValue = (value: any): string => {
    if (Array.isArray(value)) return `"${value.join(';')}"`;
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [headers.join(',')];
  data.forEach(row => {
    rows.push(headers.map(h => escapeValue(row[h])).join(','));
  });
  return rows.join('\n');
};

const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        if (inQuotes && lines[i][j + 1] === '"') {
          currentValue += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    const row: any = {};
    headers.forEach((header, index) => {
      let value: any = values[index] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      
      // Try to parse numbers
      if (value && !isNaN(Number(value)) && value !== '') {
        const num = Number(value);
        if (!isNaN(num)) value = num;
      }
      
      // Handle arrays (semicolon-separated)
      if (typeof value === 'string' && value.includes(';')) {
        value = value.split(';').map(v => {
          const num = Number(v.trim());
          return isNaN(num) ? v.trim() : num;
        });
      }
      
      row[header] = value;
    });
    rows.push(row);
  }
  
  return rows;
};

export const Advanced: React.FC<AdvancedProps> = ({ activities, sessions, refreshData }) => {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportActivities = () => {
    const csv = convertToCSV(activities, ['id', 'name', 'goal', 'goal_scale', 'created_at']);
    downloadCSV(csv, `pulsetrack-activities-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportSessions = () => {
    const csv = convertToCSV(sessions, ['id', 'name', 'start_time', 'end_time', 'activity_ids']);
    downloadCSV(csv, `pulsetrack-sessions-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportAll = () => {
    const allData = [
      ...activities.map(a => ({ type: 'activity', ...a })),
      ...sessions.map(s => ({ type: 'session', ...s }))
    ];
    const headers = Array.from(new Set<string>(['type', ...Object.keys(activities[0] || {}), ...Object.keys(sessions[0] || {})]));
    const csv = convertToCSV(allData, headers);
    downloadCSV(csv, `pulsetrack-all-data-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus({ type: null, message: '' });

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        setImportStatus({ type: 'error', message: 'CSV file is empty or invalid' });
        return;
      }

      // Check if it's a combined export (has 'type' column) or separate
      const hasTypeColumn = rows[0].hasOwnProperty('type');
      
      let activitiesImported = 0;
      let sessionsImported = 0;
      let errors: string[] = [];

      if (hasTypeColumn) {
        // Combined format
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            if (row.type === 'activity') {
              const activity: Omit<Activity, 'id' | 'created_at'> = {
                name: String(row.name || ''),
                goal: Number(row.goal) || 0,
                goal_scale: (row.goal_scale as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily',
                color: String(row.color || '#3b82f6'),
              };
              await createActivity(activity);
              activitiesImported++;
            } else if (row.type === 'session') {
              const activityIds = Array.isArray(row.activity_ids) 
                ? row.activity_ids 
                : (typeof row.activity_ids === 'string' ? row.activity_ids.split(';').map(id => Number(id.trim())).filter(id => !isNaN(id)) : []);
              
              const session: Omit<Session, 'id'> = {
                name: String(row.name || ''),
                start_time: Number(row.start_time) || Date.now(),
                end_time: Number(row.end_time) || Date.now(),
                activity_ids: activityIds,
              };
              await createSession(session);
              sessionsImported++;
            }
          } catch (error) {
            errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        // Check which format based on headers
        const headers = Object.keys(rows[0]);
        const isActivityFormat = headers.includes('goal') && headers.includes('goal_scale');
        const isSessionFormat = headers.includes('start_time') && headers.includes('end_time');

        if (isActivityFormat) {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              const activity: Omit<Activity, 'id' | 'created_at'> = {
                name: String(row.name || ''),
                goal: Number(row.goal) || 0,
                goal_scale: (row.goal_scale as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily',
                color: String(row.color || '#3b82f6'),
              };
              await createActivity(activity);
              activitiesImported++;
            } catch (error) {
              errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } else if (isSessionFormat) {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              const activityIds = Array.isArray(row.activity_ids) 
                ? row.activity_ids 
                : (typeof row.activity_ids === 'string' ? row.activity_ids.split(';').map(id => Number(id.trim())).filter(id => !isNaN(id)) : []);
              
              const session: Omit<Session, 'id'> = {
                name: String(row.name || ''),
                start_time: Number(row.start_time) || Date.now(),
                end_time: Number(row.end_time) || Date.now(),
                activity_ids: activityIds,
              };
              await createSession(session);
              sessionsImported++;
            } catch (error) {
              errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } else {
          setImportStatus({ type: 'error', message: 'CSV format not recognized. Please use exported CSV files.' });
          return;
        }
      }

      // Refresh data
      await refreshData();

      // Show success/error message
      if (errors.length > 0) {
        setImportStatus({ 
          type: 'error', 
          message: `Imported ${activitiesImported} activities and ${sessionsImported} sessions, but ${errors.length} errors occurred.` 
        });
      } else {
        setImportStatus({ 
          type: 'success', 
          message: `Successfully imported ${activitiesImported} activities and ${sessionsImported} sessions.` 
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setImportStatus({ 
        type: 'error', 
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Advanced</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Export and import your PulseTrack data as CSV files for backup or analysis.
          </p>
        </div>

        {/* Export Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Export</h2>
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

        {/* Import Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Import</h2>
          <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold leading-none tracking-tight">Import from CSV</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Import activities and sessions from a CSV file
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileImport}
                  className="cursor-pointer"
                />
              </div>

              {importStatus.type && (
                <div className={`flex items-center gap-2 p-3 rounded-md ${
                  importStatus.type === 'success' 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{importStatus.message}</span>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold">Import Format:</p>
                <p>
                  • Supports CSV files exported from PulseTrack (Activities, Sessions, or All Data)
                </p>
                <p>
                  • Activities require: name, goal, goal_scale, color (optional)
                </p>
                <p>
                  • Sessions require: name, start_time, end_time, activity_ids
                </p>
                <p>
                  • Duplicate entries will be added as new records
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

