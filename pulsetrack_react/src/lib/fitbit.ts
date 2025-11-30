// Fitbit OAuth 2.0 with PKCE and API client
// Documentation: https://dev.fitbit.com/build/reference/web-api/developer-guide/authorization/

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_BASE = 'https://api.fitbit.com/1.2';

// Get client ID from environment variable or use placeholder
// Users need to set VITE_FITBIT_CLIENT_ID in their .env.local
const CLIENT_ID = import.meta.env.VITE_FITBIT_CLIENT_ID || '';
// Ensure redirect URI matches exactly what's registered in Fitbit (with trailing slash)
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}/`
  : '';

// CORS proxy for API calls (Fitbit API doesn't allow direct browser requests)
// For production, set up a backend proxy. For development, you can use a CORS proxy service
const API_PROXY = import.meta.env.VITE_FITBIT_API_PROXY || '';
// Token proxy for token exchange (also has CORS issues)
const TOKEN_PROXY = import.meta.env.VITE_FITBIT_TOKEN_PROXY || '';

const SCOPES = 'sleep'; // Request sleep scope

interface FitbitTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number; // Calculated timestamp
  user_id?: string;
}

interface SleepLog {
  dateOfSleep: string;
  duration: number; // milliseconds
  efficiency: number;
  endTime: string;
  infoCode: number;
  isMainSleep: boolean;
  levels: {
    data: Array<{
      dateTime: string;
      level: 'wake' | 'light' | 'deep' | 'rem' | 'asleep' | 'restless' | 'awake';
      seconds: number;
    }>;
    summary: {
      deep?: { count: number; minutes: number };
      light?: { count: number; minutes: number };
      rem?: { count: number; minutes: number };
      wake?: { count: number; minutes: number };
      asleep?: { count: number; minutes: number };
      restless?: { count: number; minutes: number };
      awake?: { count: number; minutes: number };
    };
  };
  logId: number;
  minutesAfterWakeup: number;
  minutesAsleep: number;
  minutesAwake: number;
  minutesToFallAsleep: number;
  logType: 'auto_detected' | 'manual';
  startTime: string;
  timeInBed: number; // minutes
  type: 'stages' | 'classic';
}

interface SleepLogResponse {
  sleep: SleepLog[];
  summary: {
    stages?: {
      deep: number;
      light: number;
      rem: number;
      wake: number;
    };
    totalMinutesAsleep: number;
    totalSleepRecords: number;
    totalTimeInBed: number;
  };
}

const STORAGE_KEY = 'fitbit_tokens';
const CODE_VERIFIER_KEY = 'fitbit_code_verifier';

// Generate a cryptographically random string for PKCE
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate code challenge from verifier (SHA256 hash, base64url encoded)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Store tokens in localStorage
function saveTokens(tokens: FitbitTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

// Get tokens from localStorage
function getTokens(): FitbitTokens | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Clear tokens
export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CODE_VERIFIER_KEY);
}

// Check if tokens exist and are valid
export function isAuthenticated(): boolean {
  const tokens = getTokens();
  if (!tokens) return false;
  
  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes
  return tokens.expires_at > (now + buffer);
}

// Get access token, refreshing if necessary
async function getAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens) return null;

  // Check if token needs refresh
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes buffer
  
  if (tokens.expires_at <= (now + buffer)) {
    // Token expired or about to expire, refresh it
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    if (!refreshed) {
      clearTokens();
      return null;
    }
    return refreshed.access_token;
  }

  return tokens.access_token;
}

// Refresh access token
async function refreshAccessToken(refreshToken: string): Promise<FitbitTokens | null> {
  if (!CLIENT_ID) {
    throw new Error('Fitbit Client ID not configured. Please set VITE_FITBIT_CLIENT_ID in your .env.local file.');
  }

  try {
    const credentials = btoa(`${CLIENT_ID}:${import.meta.env.VITE_FITBIT_CLIENT_SECRET || ''}`);
    
    const response = await fetch(FITBIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to refresh Fitbit token:', error);
      return null;
    }

    const data = await response.json();
    const tokens: FitbitTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Use new refresh token if provided
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
      user_id: data.user_id,
    };

    saveTokens(tokens);
    return tokens;
  } catch (error) {
    console.error('Error refreshing Fitbit token:', error);
    return null;
  }
}

// Initiate OAuth flow
export async function authorize(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error('Fitbit Client ID not configured. Please set VITE_FITBIT_CLIENT_ID in your .env.local file.');
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store code verifier for later use
  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  // Redirect to Fitbit authorization page
  window.location.href = `${FITBIT_AUTH_URL}?${params.toString()}`;
}

// Handle OAuth callback and exchange code for tokens
export async function handleCallback(): Promise<boolean> {
  // Check if we're in the callback - Fitbit uses query parameters by default
  // But we also check hash fragments for SPA compatibility
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  const code = searchParams.get('code') || hashParams.get('code');
  const error = searchParams.get('error') || hashParams.get('error');

  if (error) {
    console.error('Fitbit authorization error:', error);
    // Clean up URL
    window.history.replaceState(null, '', window.location.pathname);
    return false;
  }

  if (!code) {
    return false;
  }

  // Get stored code verifier
  const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    console.error('Code verifier not found');
    return false;
  }

  if (!CLIENT_ID) {
    throw new Error('Fitbit Client ID not configured.');
  }

  try {
    // Log redirect URI for debugging
    if (import.meta.env.DEV) {
      console.log('Fitbit redirect URI:', REDIRECT_URI);
      console.log('Current URL:', window.location.href);
      console.log('Token proxy configured:', !!TOKEN_PROXY);
    }
    
    // Use token proxy if configured, otherwise try direct (may fail due to CORS)
    const tokenUrl = TOKEN_PROXY || FITBIT_TOKEN_URL;
    const credentials = btoa(`${CLIENT_ID}:${import.meta.env.VITE_FITBIT_CLIENT_SECRET || ''}`);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: TOKEN_PROXY
        ? {
            'Content-Type': 'application/json',
          }
        : {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
          },
      body: TOKEN_PROXY
        ? JSON.stringify({
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          })
        : new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to exchange Fitbit authorization code:', errorText);
      console.error('Redirect URI used:', REDIRECT_URI);
      console.error('Make sure this matches exactly in Fitbit Developer Portal');
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
      localStorage.removeItem(CODE_VERIFIER_KEY);
      return false;
    }

    const data = await response.json();
    const tokens: FitbitTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
      user_id: data.user_id,
    };

    saveTokens(tokens);
    
    // Clean up URL and code verifier
    localStorage.removeItem(CODE_VERIFIER_KEY);
    window.history.replaceState(null, '', window.location.pathname);

    return true;
  } catch (error) {
    console.error('Error exchanging Fitbit authorization code:', error);
    localStorage.removeItem(CODE_VERIFIER_KEY);
    // Clean up URL
    window.history.replaceState(null, '', window.location.pathname);
    return false;
  }
}

// Helper to make API requests through proxy if needed
async function fitbitApiRequest(url: string, accessToken: string): Promise<Response> {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
  };

  // If proxy is configured, use it; otherwise try direct (will fail due to CORS)
  const requestUrl = API_PROXY 
    ? `${API_PROXY}?url=${encodeURIComponent(url)}`
    : url;

  return fetch(requestUrl, { headers });
}

// Get sleep log for a specific date
export async function getSleepLogByDate(date: string): Promise<SleepLogResponse | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated with Fitbit');
  }

  try {
    const url = `${FITBIT_API_BASE}/user/-/sleep/date/${date}.json`;
    const response = await fitbitApiRequest(url, accessToken);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it
        clearTokens();
        throw new Error('Fitbit authentication expired. Please reconnect.');
      }
      const errorText = await response.text();
      console.error('Failed to fetch Fitbit sleep data:', errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Fitbit sleep data:', error);
    throw error;
  }
}

// Get sleep logs for a date range
export async function getSleepLogsByDateRange(startDate: string, endDate: string): Promise<SleepLogResponse | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated with Fitbit');
  }

  try {
    const url = `${FITBIT_API_BASE}/user/-/sleep/date/${startDate}/${endDate}.json`;
    const response = await fitbitApiRequest(url, accessToken);

    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
        throw new Error('Fitbit authentication expired. Please reconnect.');
      }
      const errorText = await response.text();
      console.error('Failed to fetch Fitbit sleep data:', errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Fitbit sleep data:', error);
    throw error;
  }
}

// Get user info
export async function getUserInfo(): Promise<{ user_id: string } | null> {
  const tokens = getTokens();
  if (tokens?.user_id) {
    return { user_id: tokens.user_id };
  }
  return null;
}

export type { SleepLog, SleepLogResponse };

