import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, CheckCircle, RotateCcw, Clock, Timer } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
// import { Select } from './ui/Select';
import { LogSessionDialog } from './LogSessionDialog';
import { ActivityBadge } from './ui/ActivityBadge';
import { type Activity } from '../lib/db';

interface CurrentSessionProps {
  activities: Activity[];
  onAddSession: (session: Omit<import('../lib/db').Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'>) => Promise<void>;
}

type TimerType = 'countdown' | 'stopwatch';

const STORAGE_KEY = 'pulsetrack_timer_state';

interface TimerState {
  timerType: TimerType;
  isRunning: boolean;
  timerStartTimestamp: number | null; // When timer was started/resumed
  pausedElapsedTime: number; // Accumulated elapsed time for stopwatch when paused
  initialRemainingTime: number; // Initial remaining time for countdown
  countdownHours: number;
  countdownMinutes: number;
  countdownSeconds: number;
  sessionStartTime: number | null;
  sessionName: string;
  selectedActivityIds: string[];
}

export const CurrentSession: React.FC<CurrentSessionProps> = ({
  activities,
  onAddSession,
}) => {
  // Load initial state from localStorage
  const loadTimerState = useCallback((): Partial<TimerState> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load timer state from localStorage:', error);
    }
    return {};
  }, []);

  // Save timer state to localStorage
  const saveTimerState = useCallback((state: Partial<TimerState>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save timer state to localStorage:', error);
    }
  }, []);

  const initialState = loadTimerState();

  const [timerType, setTimerType] = useState<TimerType>(initialState.timerType || 'stopwatch');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>(initialState.selectedActivityIds || []);
  const [sessionName, setSessionName] = useState(initialState.sessionName || '');

  // Countdown timer state
  const [countdownHours, setCountdownHours] = useState(initialState.countdownHours || 0);
  const [countdownMinutes, setCountdownMinutes] = useState(initialState.countdownMinutes || 0);
  const [countdownSeconds, setCountdownSeconds] = useState(initialState.countdownSeconds || 0);

  // Timer state - using timestamp-based approach
  const [isRunning, setIsRunning] = useState(initialState.isRunning || false);
  const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(initialState.timerStartTimestamp || null);
  const [pausedElapsedTime, setPausedElapsedTime] = useState(initialState.pausedElapsedTime || 0); // For stopwatch
  const [initialRemainingTime, setInitialRemainingTime] = useState(initialState.initialRemainingTime || 0); // For countdown
  const intervalRef = useRef<number | null>(null);

  // Dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(initialState.sessionStartTime || null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // User denied or error occurred, silently fail
      });
    }
  }, []);

  // Track if we've already restored the timer state to prevent double-adjustment
  const hasRestoredRef = useRef(false);
  // Store the restoration time to use consistently in calculations
  const restorationTimeRef = useRef<number | null>(null);

  // Check timer state on mount - handle case where timer was running when user navigated away
  useEffect(() => {
    // Only restore once on mount
    if (hasRestoredRef.current) return;

    if (isRunning && timerStartTimestamp) {
      // Capture the exact moment we're restoring - do this synchronously
      const restoreTime = Date.now();
      restorationTimeRef.current = restoreTime;

      // Calculate how much time has passed since the timer was started
      const storedTimestamp = timerStartTimestamp;
      const elapsedSinceStart = restoreTime - storedTimestamp;

      if (timerType === 'countdown') {
        // Use the current initialRemainingTime value (from localStorage)
        const storedRemaining = initialRemainingTime;
        const currentRemaining = storedRemaining - elapsedSinceStart;

        if (currentRemaining <= 0) {
          // Timer completed while away
          setIsRunning(false);
          setTimerStartTimestamp(null);
          setInitialRemainingTime(0);
          hasRestoredRef.current = true;
          restorationTimeRef.current = null;
          // Use setTimeout to ensure state is set before calling handleTimerComplete
          setTimeout(() => {
            handleTimerComplete();
          }, 0);
        } else {
          // Timer is still running, update both values in a single batch
          // React will batch these updates, so calculateCurrentTime won't see intermediate states
          setInitialRemainingTime(currentRemaining);
          setTimerStartTimestamp(restoreTime);
          hasRestoredRef.current = true;
          // Clear restoration time after a brief moment to allow state to settle
          setTimeout(() => {
            restorationTimeRef.current = null;
          }, 100);
        }
      } else {
        // For stopwatch, adjust paused elapsed time to account for time passed while away
        // Calculate the new total elapsed time
        const newTotalElapsed = pausedElapsedTime + elapsedSinceStart;
        // Update both values in a single batch
        setPausedElapsedTime(newTotalElapsed);
        setTimerStartTimestamp(restoreTime);
        hasRestoredRef.current = true;
        // Clear restoration time after a brief moment to allow state to settle
        setTimeout(() => {
          restorationTimeRef.current = null;
        }, 100);
      }
    } else {
      hasRestoredRef.current = true;
    }
  }, []); // Only run on mount

  // Calculate current elapsed/remaining time based on timestamps
  const calculateCurrentTime = useCallback((): number => {
    if (!timerStartTimestamp) {
      return timerType === 'stopwatch' ? pausedElapsedTime : initialRemainingTime;
    }

    // During restoration, use the restoration time to avoid timing discrepancies
    // After restoration completes, use current time
    const now = restorationTimeRef.current ?? Date.now();
    const elapsedSinceStart = now - timerStartTimestamp;

    if (timerType === 'stopwatch') {
      return pausedElapsedTime + elapsedSinceStart;
    } else {
      // Countdown
      const remaining = initialRemainingTime - elapsedSinceStart;
      return Math.max(0, remaining);
    }
  }, [timerType, timerStartTimestamp, pausedElapsedTime, initialRemainingTime]);

  // Get current display time
  const elapsedTime = timerType === 'stopwatch' ? calculateCurrentTime() : 0;
  const remainingTime = timerType === 'countdown' ? calculateCurrentTime() : 0;

  // Persist timer state whenever it changes
  useEffect(() => {
    saveTimerState({
      timerType,
      isRunning,
      timerStartTimestamp,
      pausedElapsedTime,
      initialRemainingTime,
      countdownHours,
      countdownMinutes,
      countdownSeconds,
      sessionStartTime,
      sessionName,
      selectedActivityIds,
    });
  }, [
    timerType,
    isRunning,
    timerStartTimestamp,
    pausedElapsedTime,
    initialRemainingTime,
    countdownHours,
    countdownMinutes,
    countdownSeconds,
    sessionStartTime,
    sessionName,
    selectedActivityIds,
    saveTimerState,
  ]);

  // Play sound when timer completes
  const playTimerSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Higher pitch
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play multiple beeps for better notice
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 800;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 300);
    } catch (error) {
      // Fallback: try using HTML5 audio if Web Audio API fails
      console.warn('Could not play sound:', error);
    }
  };

  // Show notification when timer completes
  const showTimerNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationTitle = 'Timer Complete!';
      const notificationBody = sessionName
        ? `Your session "${sessionName}" timer has finished.`
        : 'Your timer has finished.';

      new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/vite.svg', // You can replace this with a custom icon
        badge: '/vite.svg',
        tag: 'timer-complete',
        requireInteraction: false,
      });
    }
  };

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    console.log('handleTimerComplete called, sessionStartTime:', sessionStartTime);

    // IMPORTANT: Set dialog state FIRST (before sound) for Chrome mobile compatibility
    // Chrome can lose user interaction context during sound playback
    if (sessionStartTime) {
      console.log('Setting showSaveDialog to true');
      setShowSaveDialog(true);

      // Play sound AFTER setting dialog state, with a small delay to ensure dialog renders
      // This prevents Chrome mobile from blocking the state update
      setTimeout(() => {
        playTimerSound();
        showTimerNotification();
      }, 100);
    } else {
      console.log('No sessionStartTime, not showing dialog');
      // Still play sound even if no session to save
      playTimerSound();
      showTimerNotification();
    }
  }, [sessionStartTime, sessionName]);

  // Initialize countdown time when timer type or duration changes (but not when pausing)
  // Use a ref to track previous values to detect actual changes
  const prevTimerTypeRef = useRef<TimerType | null>(null);
  const prevDurationRef = useRef<{ countdownHours: number; countdownMinutes: number; countdownSeconds: number } | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount - state is already initialized from localStorage
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevTimerTypeRef.current = timerType;
      prevDurationRef.current = { countdownHours, countdownMinutes, countdownSeconds };
      return;
    }

    const timerTypeChanged = prevTimerTypeRef.current !== null && prevTimerTypeRef.current !== timerType;
    const durationChanged = prevDurationRef.current !== null && (
      prevDurationRef.current.countdownHours !== countdownHours ||
      prevDurationRef.current.countdownMinutes !== countdownMinutes ||
      prevDurationRef.current.countdownSeconds !== countdownSeconds
    );

    // Only reset if timer type changed or duration changed, and timer is not running
    // Don't reset when just pausing (isRunning changes but type/duration don't)
    if ((timerTypeChanged || durationChanged) && !isRunning) {
      if (timerType === 'countdown') {
        const totalMs = (countdownHours * 3600 + countdownMinutes * 60 + countdownSeconds) * 1000;
        setInitialRemainingTime(totalMs);
        setTimerStartTimestamp(null);
        setPausedElapsedTime(0);
      } else if (timerType === 'stopwatch' && timerTypeChanged) {
        // Only reset stopwatch if timer type actually changed
        setPausedElapsedTime(0);
        setTimerStartTimestamp(null);
      }
    }

    prevTimerTypeRef.current = timerType;
    prevDurationRef.current = { countdownHours, countdownMinutes, countdownSeconds };
  }, [timerType, countdownHours, countdownMinutes, countdownSeconds]); // Removed isRunning from dependencies

  // Timer logic - update UI periodically, but calculate time from timestamps
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Update UI every 100ms for smooth display
    intervalRef.current = window.setInterval(() => {
      if (timerType === 'countdown') {
        const currentRemaining = calculateCurrentTime();
        if (currentRemaining <= 0) {
          setIsRunning(false);
          setTimerStartTimestamp(null);
          setInitialRemainingTime(0);
          handleTimerComplete();
        }
      }
      // Force re-render to update display
      // The display time is calculated from timestamps, so this just triggers a re-render
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timerType, calculateCurrentTime, handleTimerComplete]);

  // Handle window visibility changes to ensure accurate timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && timerStartTimestamp) {
        // When tab becomes visible, recalculate elapsed time
        // This ensures accuracy even if the tab was inactive
        if (timerType === 'stopwatch') {
          const now = Date.now();
          const elapsedSinceStart = now - timerStartTimestamp;
          setPausedElapsedTime(prev => prev + elapsedSinceStart);
          setTimerStartTimestamp(now);
        } else {
          // For countdown, check if timer should have completed
          const currentRemaining = calculateCurrentTime();
          if (currentRemaining <= 0) {
            setIsRunning(false);
            setTimerStartTimestamp(null);
            setInitialRemainingTime(0);
            handleTimerComplete();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, timerType, timerStartTimestamp, calculateCurrentTime, handleTimerComplete]);

  const handleStart = () => {
    if (timerType === 'countdown') {
      // If resuming, use current remaining time; otherwise use the set duration
      if (initialRemainingTime <= 0) {
        const totalMs = (countdownHours * 3600 + countdownMinutes * 60 + countdownSeconds) * 1000;
        if (totalMs <= 0) {
          alert('Please set a countdown duration first.');
          return;
        }
        setInitialRemainingTime(totalMs);
      }
    }
    if (selectedActivityIds.length === 0) {
      alert('Please select at least one activity.');
      return;
    }

    const now = Date.now();
    setIsRunning(true);
    setTimerStartTimestamp(now);

    if (!sessionStartTime) {
      setSessionStartTime(now);
    }
  };

  const handlePause = () => {
    if (timerType === 'stopwatch' && timerStartTimestamp) {
      // Save accumulated elapsed time
      const now = Date.now();
      const elapsedSinceStart = now - timerStartTimestamp;
      setPausedElapsedTime(prev => prev + elapsedSinceStart);
    } else if (timerType === 'countdown' && timerStartTimestamp) {
      // Save current remaining time
      const currentRemaining = calculateCurrentTime();
      setInitialRemainingTime(currentRemaining);
    }

    setIsRunning(false);
    setTimerStartTimestamp(null);
  };

  const handleFinish = () => {
    console.log('handleFinish called, sessionStartTime:', sessionStartTime);
    setIsRunning(false);
    setTimerStartTimestamp(null);
    if (sessionStartTime) {
      console.log('Calling handleTimerComplete from handleFinish');
      handleTimerComplete();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimerStartTimestamp(null);
    setPausedElapsedTime(0);
    if (timerType === 'countdown') {
      const totalMs = (countdownHours * 3600 + countdownMinutes * 60 + countdownSeconds) * 1000;
      setInitialRemainingTime(totalMs);
    }
    setSessionStartTime(null);
    // Clear localStorage state
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSaveSession = (session: Omit<import('../lib/db').Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'>) => {
    onAddSession(session);
    setShowSaveDialog(false);
    handleReset();
    setSessionName('');
    setSelectedActivityIds([]);
    // Clear localStorage after saving
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const toggleActivity = (syncId: string) => {
    setSelectedActivityIds(prev =>
      prev.includes(syncId) ? prev.filter(aid => aid !== syncId) : [...prev, syncId]
    );
  };

  const displayTime = timerType === 'stopwatch' ? elapsedTime : remainingTime;

  // Force re-render periodically when running to update display
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Current Session</h1>

        {/* Session Name */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Session Name</label>
          <Input
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g. Morning Workout"
            disabled={isRunning}
          />
        </div>

        {/* Activity Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">
            Select Activities <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border p-3 rounded-md bg-card">
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activities available. Create activities in the Advanced page.</p>
            ) : (
              activities.map(activity => {
                const isSelected = activity.sync_id && selectedActivityIds.includes(activity.sync_id);
                return (
                  <ActivityBadge
                    key={activity.sync_id}
                    name={activity.name}
                    color={activity.color}
                    isSelected={!!isSelected}
                    onClick={() => activity.sync_id && !isRunning && toggleActivity(activity.sync_id)}
                    className={isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    size="md"
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Timer Type Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Timer Type</label>
          <div
            className={`relative inline-flex bg-card border border-border rounded-lg p-1 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ width: 'fit-content' }}
          >
            {/* Sliding background indicator */}
            <div
              className="absolute top-1 bottom-1 bg-primary rounded-md transition-all duration-300 ease-in-out"
              style={{
                left: timerType === 'stopwatch' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
              }}
            />

            {/* Stopwatch option */}
            <button
              onClick={() => !isRunning && setTimerType('stopwatch')}
              disabled={isRunning}
              className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-300 ${timerType === 'stopwatch'
                ? 'text-primary-foreground'
                : 'text-foreground hover:text-primary'
                } ${isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">Stopwatch</span>
            </button>

            {/* Countdown option */}
            <button
              onClick={() => !isRunning && setTimerType('countdown')}
              disabled={isRunning}
              className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-300 ${timerType === 'countdown'
                ? 'text-primary-foreground'
                : 'text-foreground hover:text-primary'
                } ${isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Timer className="h-4 w-4" />
              <span className="font-medium">Countdown</span>
            </button>
          </div>
        </div>

        {/* Countdown Duration Input */}
        {timerType === 'countdown' && !isRunning && (
          <div className="mb-6">
            <label className="text-sm font-medium block mb-2">Set Duration</label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Hours</label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={countdownHours}
                  onChange={(e) => setCountdownHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="text-center"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Minutes</label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={countdownMinutes}
                  onChange={(e) => setCountdownMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-center"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Seconds</label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={countdownSeconds}
                  onChange={(e) => setCountdownSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="text-center"
                />
              </div>
            </div>
          </div>
        )}

        {/* Timer Display - Clickable to Start/Pause */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (isRunning) {
                handlePause();
              } else {
                handleStart();
              }
            }}
            disabled={!isRunning && (selectedActivityIds.length === 0 || (timerType === 'countdown' && remainingTime <= 0))}
            className={`w-full bg-card border-2 border-border rounded-lg p-8 sm:p-12 text-center transition-all ${selectedActivityIds.length === 0 || (timerType === 'countdown' && remainingTime <= 0 && !isRunning)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-primary hover:shadow-lg cursor-pointer'
              }`}
          >
            <div className={`text-6xl sm:text-7xl md:text-8xl font-mono font-bold mb-4 ${timerType === 'countdown' && remainingTime <= 60000 && remainingTime > 0
              ? 'text-destructive animate-pulse'
              : 'text-primary'
              }`}>
              {formatTime(displayTime)}
            </div>
            {timerType === 'countdown' && remainingTime <= 0 && !isRunning && (
              <p className="text-muted-foreground text-sm">Timer completed</p>
            )}
            {!isRunning && selectedActivityIds.length > 0 && !(timerType === 'countdown' && remainingTime <= 0) && (
              <Play className="h-12 w-12 mx-auto mt-4 text-primary" />
            )}
            {isRunning && (
              <Pause className="h-12 w-12 mx-auto mt-4 text-primary" />
            )}
          </button>
        </div>

        {/* Timer Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Button
            onClick={handleFinish}
            size="lg"
            variant="default"
            disabled={!sessionStartTime}
            className="min-w-[180px]"
          >
            <CheckCircle className="h-6 w-6 mr-2" />
            Finish
          </Button>

          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            disabled={isRunning}
            className="min-w-[180px]"
          >
            <RotateCcw className="h-6 w-6 mr-2" />
            Reset
          </Button>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && sessionStartTime && (
          <LogSessionDialog
            isOpen={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            onSave={handleSaveSession}
            activities={activities}
            initialActivityId={selectedActivityIds[0] || null}
            initialStartTime={sessionStartTime}
            initialEndTime={Date.now()}
            initialName={sessionName}
          />
        )}
      </div>
    </div>
  );
};

