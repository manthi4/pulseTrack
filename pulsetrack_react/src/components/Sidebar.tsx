import React, { useState } from 'react';
import { LayoutDashboard, ChevronLeft, ChevronRight, RotateCcw, Settings, TrendingUp, SlidersHorizontal, PlayCircle, List } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useMobileMenu } from './Layout';

type Page = 'dashboard' | 'advanced' | 'trends' | 'settings' | 'currentSession' | 'sessions';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onSelectActivity: (id: number | null) => void;
  selectedActivityId: number | null;
  onReset: () => void;
}

type NavItem = {
  id: Page;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  onSelectActivity,
  selectedActivityId,
  onReset,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const mobileMenu = useMobileMenu();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => {
        onPageChange('dashboard');
        onSelectActivity(null);
        mobileMenu?.closeMobileMenu();
      },
    },
    {
      id: 'currentSession',
      label: 'Current Session',
      icon: <PlayCircle className="h-5 w-5" />,
      onClick: () => {
        onPageChange('currentSession');
        mobileMenu?.closeMobileMenu();
      },
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => {
        onPageChange('trends');
        mobileMenu?.closeMobileMenu();
      },
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <List className="h-5 w-5" />,
      onClick: () => {
        onPageChange('sessions');
        mobileMenu?.closeMobileMenu();
      },
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => {
        onPageChange('advanced');
        mobileMenu?.closeMobileMenu();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SlidersHorizontal className="h-5 w-5" />,
      onClick: () => {
        onPageChange('settings');
        mobileMenu?.closeMobileMenu();
      },
    },
  ];

  return (
    <div 
      className={cn(
        "bg-card border-r border-border/50 h-screen flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64",
        "md:relative fixed"
      )}
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        {!isCollapsed && (
          <h1 
            className="text-xl font-bold cursor-pointer bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity" 
            onClick={() => {
              onSelectActivity(null);
              mobileMenu?.closeMobileMenu();
            }}
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
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "w-full rounded-md transition-colors flex items-center",
                currentPage === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-foreground",
                isCollapsed ? "justify-center p-2" : "text-left px-4 py-2 gap-3"
              )}
              title={item.label}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={() => {
            onReset();
            mobileMenu?.closeMobileMenu();
          }}
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
