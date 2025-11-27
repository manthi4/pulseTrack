import React, { useState } from 'react';
import { LayoutDashboard, ChevronLeft, ChevronRight, RotateCcw, Settings, TrendingUp, SlidersHorizontal, PlayCircle, List, AlertTriangle, ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useMobileMenu } from './Layout';
import { type Activity, type Session } from '../lib/db';
import { usePWAInstall } from '../hooks/usePWAInstall';

type Page = 'dashboard' | 'advanced' | 'trends' | 'settings' | 'currentSession' | 'sessions';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onSelectActivity: (syncId: string | null) => void;
  selectedActivityId: string | null;
  onReset: () => void;
  activities: Activity[];
  sessions: Session[];
  onDeleteAllData: () => Promise<void>;
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
  selectedActivityId: _selectedActivityId,
  onReset,
  activities: _activities,
  sessions: _sessions,
  onDeleteAllData,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDevAreaOpen, setIsDevAreaOpen] = useState(false);
  const mobileMenu = useMobileMenu();
  const { isInstallable, isInstalled, promptInstall, tryManualInstall, debugInfo } = usePWAInstall();

  const handleDeleteAllData = async () => {
    if (confirm('Are you sure you want to delete ALL data? This will permanently delete all activities and sessions. This action cannot be undone.')) {
      await onDeleteAllData();
      mobileMenu?.closeMobileMenu();
    }
  };

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

      <div className="p-4 border-t border-border/50 space-y-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsDevAreaOpen(!isDevAreaOpen);
            mobileMenu?.closeMobileMenu();
          }}
          className={cn(
            "w-full transition-colors",
            isCollapsed ? "justify-center p-2" : "justify-start px-4 py-2 gap-2"
          )}
          title="Dev Area"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          {!isCollapsed && (
            <>
              <span>Dev Area</span>
              {isDevAreaOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </>
          )}
        </Button>
        {isDevAreaOpen && !isCollapsed && (
          <div className="space-y-2 pl-4 border-l-2 border-border/30">
            {isInstallable && !isInstalled && (
              <Button
                variant="outline"
                onClick={async () => {
                  await promptInstall();
                  mobileMenu?.closeMobileMenu();
                }}
                className="w-full transition-colors justify-start px-4 py-2 gap-2 text-primary hover:text-primary"
                title="Install PWA"
              >
                <Download className="h-4 w-4" />
                <span>Install PWA</span>
              </Button>
            )}
            {!isInstallable && !isInstalled && (
              <Button
                variant="outline"
                onClick={async () => {
                  await tryManualInstall();
                  mobileMenu?.closeMobileMenu();
                }}
                className="w-full transition-colors justify-start px-4 py-2 gap-2"
                title="Try Install (Debug)"
              >
                <Download className="h-4 w-4" />
                <span>Try Install (Debug)</span>
              </Button>
            )}
            {isInstalled && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                ✓ App Installed
              </div>
            )}
            {debugInfo && (
              <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/50 rounded border border-border/30">
                <div className="font-semibold mb-1">Debug Info:</div>
                <div className="break-words">{debugInfo}</div>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleDeleteAllData}
              className="w-full transition-colors justify-start px-4 py-2 gap-2 text-destructive hover:text-destructive"
              title="Delete All Data"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Data</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onReset();
                mobileMenu?.closeMobileMenu();
              }}
              className="w-full transition-colors justify-start px-4 py-2 gap-2"
              title="Reset Data"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Data</span>
            </Button>
          </div>
        )}
        {isDevAreaOpen && isCollapsed && (
          <div className="space-y-2">
            {(isInstallable || !isInstalled) && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (isInstallable) {
                    await promptInstall();
                  } else {
                    await tryManualInstall();
                  }
                  mobileMenu?.closeMobileMenu();
                }}
                className="w-full transition-colors justify-center p-2 text-primary hover:text-primary"
                title={isInstallable ? "Install PWA" : "Try Install (Debug)"}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDeleteAllData}
              className="w-full transition-colors justify-center p-2 text-destructive hover:text-destructive"
              title="Delete All Data"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onReset();
                mobileMenu?.closeMobileMenu();
              }}
              className="w-full transition-colors justify-center p-2"
              title="Reset Data"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
