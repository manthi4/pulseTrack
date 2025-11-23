import { useState } from 'react'
import { Layout } from './components/Layout'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Advanced } from './components/Advanced'
import { Trends } from './components/Trends'
import { Settings } from './components/Settings'
import { CurrentSession } from './components/CurrentSession'
import { Sessions } from './components/Sessions'
import { useAppData } from './hooks/useAppData'
import { ThemeProvider } from './contexts/ThemeContext'

type Page = 'dashboard' | 'advanced' | 'trends' | 'settings' | 'currentSession' | 'sessions';

function App() {
  const { 
    activities, 
    sessions, 
    addSession, 
    editSession,
    removeSession,
    addActivity,
    editActivity,
    removeActivity, 
    resetData,
    refreshData
  } = useAppData();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

  const handleReset = async () => {
    if (await resetData()) {
      setSelectedActivityId(null);
    }
  };
  
  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    if (page === 'dashboard') setSelectedActivityId(null);
  };

  return (
    <ThemeProvider>
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
          <Advanced activities={activities} sessions={sessions} refreshData={refreshData} />
        ) : currentPage === 'trends' ? (
          <Trends activities={activities} sessions={sessions} />
        ) : currentPage === 'settings' ? (
          <Settings />
        ) : currentPage === 'currentSession' ? (
          <CurrentSession activities={activities} onAddSession={addSession} />
        ) : currentPage === 'sessions' ? (
          <Sessions
            sessions={sessions}
            activities={activities}
            onDeleteSession={removeSession}
            onEditSession={editSession}
            onAddSession={addSession}
          />
        ) : (
          <Dashboard
            activities={activities}
            sessions={sessions}
            selectedActivityId={selectedActivityId}
            onSelectActivity={setSelectedActivityId}
            onAddActivity={addActivity}
            onEditActivity={editActivity}
            onDeleteActivity={removeActivity}
            onAddSession={addSession}
            onEditSession={editSession}
            onDeleteSession={removeSession}
          />
        )}
      </Layout>
    </ThemeProvider>
  )
}

export default App
