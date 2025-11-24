import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, CheckCircle, RotateCcw, Clock, Timer } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
// import { Select } from './ui/Select';
import { LogSessionDialog } from './LogSessionDialog';
import { type Activity } from '../lib/db';

interface CurrentSessionProps {
  activities: Activity[];
  onAddSession: (session: Omit<import('../lib/db').Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'>) => Promise<void>;
}

type TimerType = 'countdown' | 'stopwatch';

export const CurrentSession: React.FC<CurrentSessionProps> = ({
  activities,
  onAddSession,
}) => {
  const [timerType, setTimerType] = useState<TimerType>('stopwatch');
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [sessionName, setSessionName] = useState('');

  // Countdown timer state
  const [countdownHours, setCountdownHours] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in milliseconds
  const [remainingTime, setRemainingTime] = useState(0); // in milliseconds for countdown
  // const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // User denied or error occurred, silently fail
      });
    }
  }, []);

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
    // Play sound and show notification
    playTimerSound();
    showTimerNotification();

    if (sessionStartTime) {
      setShowSaveDialog(true);
    }
  }, [sessionStartTime, sessionName]);

  // Initialize countdown time
  useEffect(() => {
    if (timerType === 'countdown') {
      const totalMs = (countdownHours * 3600 + countdownMinutes * 60 + countdownSeconds) * 1000;
      setRemainingTime(totalMs);
    } else {
      setElapsedTime(0);
    }
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timerType, countdownHours, countdownMinutes, countdownSeconds]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (timerType === 'stopwatch') {
        setElapsedTime(prev => prev + 100);
      } else {
        setRemainingTime(prev => {
          const newTime = prev - 100;
          if (newTime <= 0) {
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return newTime;
        });
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timerType, handleTimerComplete]);

  const handleStart = () => {
    if (timerType === 'countdown' && remainingTime <= 0) {
      alert('Please set a countdown duration first.');
      return;
    }
    if (selectedActivityIds.length === 0) {
      alert('Please select at least one activity.');
      return;
    }
    setIsRunning(true);
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleFinish = () => {
    setIsRunning(false);
    if (sessionStartTime) {
      handleTimerComplete();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    if (timerType === 'countdown') {
      const totalMs = (countdownHours * 3600 + countdownMinutes * 60 + countdownSeconds) * 1000;
      setRemainingTime(totalMs);
    }
    setSessionStartTime(null);
  };

  const handleSaveSession = (session: Omit<import('../lib/db').Session, 'id' | 'sync_id' | 'updated_at' | 'deleted_at'>) => {
    onAddSession(session);
    setShowSaveDialog(false);
    handleReset();
    setSessionName('');
    setSelectedActivityIds([]);
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

  const toggleActivity = (id: number) => {
    setSelectedActivityIds(prev =>
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  const displayTime = timerType === 'stopwatch' ? elapsedTime : remainingTime;

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Current Session</h1>

        {/* Session Name */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Session Name (Optional)</label>
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
                const color = activity.color || '#3b82f6';
                const isSelected = activity.id && selectedActivityIds.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    onClick={() => activity.id && !isRunning && toggleActivity(activity.id)}
                    disabled={isRunning}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${isSelected
                      ? 'shadow-md'
                      : 'hover:opacity-80'
                      } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      backgroundColor: isSelected ? color : `${color}15`,
                      borderColor: isSelected ? color : `${color}40`,
                      color: isSelected ? 'white' : color,
                    }}
                  >
                    {activity.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Timer Type Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium block mb-2">Timer Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => !isRunning && setTimerType('stopwatch')}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${timerType === 'stopwatch'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-accent'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Clock className="h-4 w-4" />
              Stopwatch
            </button>
            <button
              onClick={() => !isRunning && setTimerType('countdown')}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${timerType === 'countdown'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-accent'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Timer className="h-4 w-4" />
              Countdown
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

        {/* Timer Display */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-8 sm:p-12 text-center">
            <div className={`text-6xl sm:text-7xl md:text-8xl font-mono font-bold mb-4 ${timerType === 'countdown' && remainingTime <= 60000 && remainingTime > 0
              ? 'text-destructive animate-pulse'
              : 'text-primary'
              }`}>
              {formatTime(displayTime)}
            </div>
            {timerType === 'countdown' && remainingTime <= 0 && !isRunning && (
              <p className="text-muted-foreground text-sm">Timer completed</p>
            )}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              size="lg"
              disabled={selectedActivityIds.length === 0 || (timerType === 'countdown' && remainingTime <= 0)}
              className="min-w-[120px]"
            >
              <Play className="h-5 w-5 mr-2" />
              Start
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              size="lg"
              variant="secondary"
              className="min-w-[120px]"
            >
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </Button>
          )}

          <Button
            onClick={handleFinish}
            size="lg"
            variant="default"
            disabled={!sessionStartTime}
            className="min-w-[120px]"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Finish
          </Button>

          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            disabled={isRunning}
            className="min-w-[120px]"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
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

