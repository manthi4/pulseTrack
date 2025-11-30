import { useState, useEffect, useCallback } from 'react';
import {
  authorize,
  handleCallback,
  isAuthenticated,
  clearTokens,
  getSleepLogByDate,
  getSleepLogsByDateRange,
  getUserInfo,
  type SleepLogResponse,
} from '../lib/fitbit';

export function useFitbit() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const authenticated = isAuthenticated();
        setIsConnected(authenticated);
        
        if (authenticated) {
          const userInfo = await getUserInfo();
          setUserId(userInfo?.user_id || null);
        }
      } catch (err) {
        console.error('Error checking Fitbit auth:', err);
        setError(err instanceof Error ? err.message : 'Failed to check authentication');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Handle OAuth callback if present (check for code in query params or hash)
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasCallback = searchParams.has('code') || hashParams.has('code') || 
                        searchParams.has('error') || hashParams.has('error');
    
    if (hasCallback) {
      handleCallback().then((success) => {
        if (success) {
          setIsConnected(true);
          getUserInfo().then((info) => {
            setUserId(info?.user_id || null);
          });
        } else {
          setError('Failed to complete Fitbit authorization');
        }
        setIsLoading(false);
      });
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await authorize();
      // authorize() redirects, so we won't reach here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Fitbit');
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTokens();
    setIsConnected(false);
    setUserId(null);
    setError(null);
  }, []);

  const fetchSleepData = useCallback(async (date: string): Promise<SleepLogResponse | null> => {
    try {
      setError(null);
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Fitbit');
      }
      return await getSleepLogByDate(date);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sleep data';
      setError(message);
      throw err;
    }
  }, []);

  const fetchSleepDataRange = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<SleepLogResponse | null> => {
    try {
      setError(null);
      if (!isAuthenticated()) {
        throw new Error('Not authenticated with Fitbit');
      }
      return await getSleepLogsByDateRange(startDate, endDate);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sleep data';
      setError(message);
      throw err;
    }
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    userId,
    connect,
    disconnect,
    fetchSleepData,
    fetchSleepDataRange,
  };
}

