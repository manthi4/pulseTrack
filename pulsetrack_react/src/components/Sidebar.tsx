import React, { useState } from 'react';
import { LayoutDashboard, ChevronLeft, ChevronRight, RotateCcw, Settings, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

type Page = 'dashboard' | 'advanced' | 'trends';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onSelectActivity: (id: number | null) => void;
  selectedActivityId: number | null;
  onReset: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  onSelectActivity,
  selectedActivityId,
  onReset,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={cn(
        "bg-card border-r border-border/50 h-screen flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        {!isCollapsed && (
          <h1 
            className="text-xl font-bold cursor-pointer bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity" 
            onClick={() => onSelectActivity(null)}
          >
            PulseTrack
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <div className="px-2 space-y-1">
          <button
            onClick={() => {
              onPageChange('dashboard');
              onSelectActivity(null);
            }}
            className={cn(
              "w-full rounded-md transition-colors flex items-center",
              currentPage === 'dashboard'
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-accent text-foreground",
               isCollapsed ? "justify-center p-2" : "text-left px-4 py-2 gap-3"
            )}
            title="Dashboard"
          >
            <LayoutDashboard className="h-5 w-5" />
            {!isCollapsed && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => onPageChange('trends')}
            className={cn(
              "w-full rounded-md transition-colors flex items-center",
              currentPage === 'trends'
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-accent text-foreground",
               isCollapsed ? "justify-center p-2" : "text-left px-4 py-2 gap-3"
            )}
            title="Trends"
          >
            <TrendingUp className="h-5 w-5" />
            {!isCollapsed && <span>Trends</span>}
          </button>
          <button
            onClick={() => onPageChange('advanced')}
            className={cn(
              "w-full rounded-md transition-colors flex items-center",
              currentPage === 'advanced'
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-accent text-foreground",
               isCollapsed ? "justify-center p-2" : "text-left px-4 py-2 gap-3"
            )}
            title="Advanced"
          >
            <Settings className="h-5 w-5" />
            {!isCollapsed && <span>Advanced</span>}
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={onReset}
          className={cn(
            "w-full transition-colors",
            isCollapsed ? "justify-center p-2" : "justify-start px-4 py-2 gap-2"
          )}
          title="Reset Data"
        >
          <RotateCcw className="h-4 w-4" />
          {!isCollapsed && <span>Reset Data</span>}
        </Button>
      </div>
    </div>
  );
};
