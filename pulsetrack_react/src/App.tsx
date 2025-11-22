import { useState, useMemo } from 'react'
import { Layout } from './components/Layout'
import { Sidebar } from './components/Sidebar'
import { SessionList } from './components/SessionList'
import { DonutChart } from './components/DonutChart'
import { LogSessionDialog } from './components/LogSessionDialog'
import { CreateActivityDialog } from './components/CreateActivityDialog'
import { type TimePeriod } from './components/TimePeriodSelector'
import { ActivityGrid } from './components/ActivityGrid'
import { DashboardHeader } from './components/DashboardHeader'
import { Advanced } from './components/Advanced'
import { Trends } from './components/Trends'
import { useAppData } from './hooks/useAppData'
import { getPeriodRange } from './lib/dateUtils'

type Page = 'dashboard' | 'advanced' | 'trends';

function App() {
  const { 
    activities, 
    sessions, 
    refreshData, 
    addSession, 
    removeSession, 
    removeActivity, 
    resetData 
  } = useAppData();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isLogSessionOpen, setIsLogSessionOpen] = useState(false);
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleActivityDelete = async (id: number) => {
    const success = await removeActivity(id);
    if (success && selectedActivityId === id) {
      setSelectedActivityId(null);
    }
  };
  
  const handleReset = async () => {
    const success = await resetData();
    if (success) {
      setSelectedActivityId(null);
    }
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);
  
  const displayedSessions = useMemo(() => {
    const { start, end } = getPeriodRange(selectedDate, timePeriod);
    const periodStartTime = start.getTime();
    const periodEndTime = end.getTime();

    return (selectedActivityId 
      ? sessions.filter(s => s.activity_ids.includes(selectedActivityId))
      : sessions
    ).filter(s => {
      const sessionEndTime = new Date(s.end_time).getTime();
      return sessionEndTime >= periodStartTime && sessionEndTime <= periodEndTime;
    });
  }, [sessions, selectedActivityId, selectedDate, timePeriod]);

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    if (page === 'dashboard') {
      setSelectedActivityId(null);
    }
  };

  return (
    <Layout
      sidebar={
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSelectActivity={setSelectedActivityId}
          selectedActivityId={selectedActivityId}
          onReset={handleReset}
        />
      }
    >
      {currentPage === 'advanced' ? (
        <Advanced activities={activities} sessions={sessions} />
      ) : currentPage === 'trends' ? (
        <Trends activities={activities} sessions={sessions} />
      ) : (
        <>
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <DashboardHeader
                title={selectedActivity ? selectedActivity.name : 'Dashboard'}
                timePeriod={timePeriod}
                selectedDate={selectedDate}
                onTimePeriodChange={setTimePeriod}
                onDateChange={setSelectedDate}
              />

              {/* Visualization Section */}
              {selectedActivity ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg p-6 col-span-full md:col-span-1 h-80">
                       <h3 className="font-semibold leading-none tracking-tight mb-4">Progress</h3>
                       <DonutChart 
                         activity={selectedActivity} 
                         sessions={sessions} 
                         timePeriod={timePeriod} 
                         selectedDate={selectedDate}
                         showPeriodLabel={true} 
                       />
                    </div>
                 </div>
              ) : (
                <ActivityGrid 
                  activities={activities}
                  sessions={sessions}
                  timePeriod={timePeriod}
                  selectedDate={selectedDate}
                  onSelectActivity={setSelectedActivityId}
                  onDeleteActivity={handleActivityDelete}
                  onCreateActivity={() => setIsCreateActivityOpen(true)}
                />
              )}

              {/* Sessions List Section */}
              <div className="pt-8 border-t">
                 <h2 className="text-xl font-bold mb-4">Sessions</h2>
                 <SessionList 
                   sessions={displayedSessions} 
                   activities={activities} 
                   onDeleteSession={removeSession}
                   onLogSession={() => setIsLogSessionOpen(true)}
                 />
              </div>
            </div>
          </div>

          <LogSessionDialog
            isOpen={isLogSessionOpen}
            onClose={() => setIsLogSessionOpen(false)}
            onSave={addSession}
            activities={activities}
            initialActivityId={selectedActivityId}
          />

          <CreateActivityDialog
            isOpen={isCreateActivityOpen}
            onClose={() => setIsCreateActivityOpen(false)}
            onActivityCreated={refreshData}
          />
        </>
      )}
    </Layout>
  )
}

export default App
