import React, { useState, useMemo } from 'react';
import { type Session, type Activity } from '../lib/db';
import { format } from 'date-fns';
import { Trash2, Clock, Plus, Edit, Search, Filter, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { LogSessionDialog } from './LogSessionDialog';
import { cn } from '../lib/utils';

interface SessionsProps {
  sessions: Session[];
  activities: Activity[];
  onDeleteSession: (id: number) => void;
  onEditSession: (id: number, session: Omit<Session, 'id'>) => Promise<void>;
  onAddSession: (session: Omit<Session, 'id'>) => Promise<void>;
}

const ITEMS_PER_PAGE = 30;

const formatDuration = (start: number, end: number) => {
  const diff = end - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const Sessions: React.FC<SessionsProps> = ({
  sessions,
  activities,
  onDeleteSession,
  onEditSession,
  onAddSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isLogSessionOpen, setIsLogSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const activityMap = useMemo(() => {
    const map = new Map<number, Activity>();
    activities.forEach(a => { if (a.id !== undefined) map.set(a.id, a); });
    return map;
  }, [activities]);

  const getActivity = (id: number) => activityMap.get(id);

  // Filter sessions based on search, activity, and date range
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Search by name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query)
      );
    }

    // Filter by activity
    if (selectedActivityId !== null) {
      filtered = filtered.filter(s => 
        s.activity_ids.includes(selectedActivityId)
      );
    }

    // Filter by date range
    if (dateRangeStart) {
      const startTime = new Date(dateRangeStart).getTime();
      filtered = filtered.filter(s => s.end_time >= startTime);
    }

    if (dateRangeEnd) {
      const endTime = new Date(dateRangeEnd).getTime();
      // Add 24 hours to include the entire end date
      const endTimeInclusive = endTime + 24 * 60 * 60 * 1000 - 1;
      filtered = filtered.filter(s => s.start_time <= endTimeInclusive);
    }

    // Sort by start_time descending (newest first)
    return filtered.sort((a, b) => b.start_time - a.start_time);
  }, [sessions, searchQuery, selectedActivityId, dateRangeStart, dateRangeEnd]);

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSessions, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedSessionIds(new Set());
  }, [searchQuery, selectedActivityId, dateRangeStart, dateRangeEnd]);

  const toggleSessionSelection = (sessionId: number) => {
    const newSet = new Set(selectedSessionIds);
    if (newSet.has(sessionId)) {
      newSet.delete(sessionId);
    } else {
      newSet.add(sessionId);
    }
    setSelectedSessionIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedSessionIds.size === paginatedSessions.length) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(paginatedSessions.map(s => s.id!).filter(id => id !== undefined)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedSessionIds.size === 0) return;
    
    selectedSessionIds.forEach(id => {
      onDeleteSession(id);
    });
    setSelectedSessionIds(new Set());
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsLogSessionOpen(true);
  };

  const handleAddSession = () => {
    setEditingSession(null);
    setIsLogSessionOpen(true);
  };

  const handleSaveSession = async (session: Omit<Session, 'id'>) => {
    if (editingSession?.id) {
      await onEditSession(editingSession.id, session);
    } else {
      await onAddSession(session);
    }
    setIsLogSessionOpen(false);
    setEditingSession(null);
  };

  const handleDuplicateSession = async (session: Session) => {
    const duration = session.end_time - session.start_time;
    const now = Date.now();
    const duplicatedSession: Omit<Session, 'id'> = {
      name: `${session.name} (Copy)`,
      start_time: now,
      end_time: now + duration,
      activity_ids: [...session.activity_ids],
    };
    await onAddSession(duplicatedSession);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedActivityId(null);
    setDateRangeStart('');
    setDateRangeEnd('');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedActivityId !== null || dateRangeStart !== '' || dateRangeEnd !== '';

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button onClick={handleAddSession} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Log Session
          </Button>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Filters</h2>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto text-xs h-7"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Activity Filter */}
            <Select
              value={selectedActivityId?.toString() || ''}
              onChange={(e) => setSelectedActivityId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Activities</option>
              {activities.map(activity => (
                <option key={activity.id} value={activity.id?.toString()}>
                  {activity.name}
                </option>
              ))}
            </Select>

            {/* Date Range Start */}
            <Input
              type="date"
              placeholder="Start Date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
            />

            {/* Date Range End */}
            <Input
              type="date"
              placeholder="End Date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSessionIds.size > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedSessionIds.size} session{selectedSessionIds.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {paginatedSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {hasActiveFilters ? 'No sessions match your filters.' : 'No sessions logged yet.'}
            </div>
          ) : (
            <>
              {/* Select All */}
              {paginatedSessions.length > 0 && (
                <div className="flex items-center gap-2 pb-2 border-b">
                  <input
                    type="checkbox"
                    checked={selectedSessionIds.size === paginatedSessions.length && paginatedSessions.length > 0}
                    onChange={toggleSelectAll}
                    style={{ backgroundColor: 'transparent' }}
                    className="h-5 w-5 rounded border-2 border-border accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary/60 checked:border-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all on this page
                  </span>
                </div>
              )}

              <div className="grid gap-4">
                {paginatedSessions.map((session) => {
                  const isSelected = session.id !== undefined && selectedSessionIds.has(session.id);
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm gap-3 transition-all",
                        isSelected && "ring-2 ring-primary border-primary"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => session.id && toggleSessionSelection(session.id)}
                          style={{ backgroundColor: 'transparent' }}
                          className="h-5 w-5 rounded border-2 border-border accent-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary/60 checked:border-primary shrink-0"
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="font-semibold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="truncate">{session.name}</span>
                            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" /> {formatDuration(session.start_time, session.end_time)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(session.start_time, 'PP p')}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {session.activity_ids.map(id => {
                              const activity = getActivity(id);
                              const color = activity?.color || '#3b82f6';
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:opacity-80"
                                  style={{
                                    borderColor: `${color}40`,
                                    backgroundColor: `${color}15`,
                                    color: color,
                                  }}
                                >
                                  {activity?.name || 'Unknown'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicateSession(session)} title="Duplicate session">
                          <Copy className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => session.id && handleEditSession(session)} title="Edit session">
                          <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => session.id && onDeleteSession(session.id)} title="Delete session">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Log Session Dialog */}
      <LogSessionDialog
        isOpen={isLogSessionOpen}
        onClose={() => {
          setIsLogSessionOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSaveSession}
        activities={activities}
        editingSession={editingSession}
      />
    </div>
  );
};

