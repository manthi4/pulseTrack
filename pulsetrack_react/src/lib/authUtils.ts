/**
 * Utility functions for authentication and user management
 */

export interface User {
  email?: string;
  name?: string;
}

export interface SyncStatus {
  phase?: 'idle' | 'in-sync' | 'error';
  status?: 'connected' | 'connecting' | 'disconnected' | 'disconnecting';
  error?: any;
  progress?: any;
  license?: string;
  lastSync?: number;
}

/**
 * Formats user display name from user object
 * Handles unauthorized states and missing data gracefully
 */
export function formatUserDisplay(user: User | null | undefined): string {
  if (!user) return 'User';
  
  const email = user.email;
  const name = user.name;
  
  // Handle "unauthorized" or invalid states
  if (name && name.toLowerCase().includes('unauthorized')) {
    return 'Not authenticated';
  }
  
  return email || (name && name !== 'unauthorized' ? name : 'User');
}

/**
 * Checks if a user is considered authenticated
 */
export function isAuthenticated(user: User | null | undefined): boolean {
  if (!user) return false;
  
  const name = user.name;
  if (name && name.toLowerCase().includes('unauthorized')) {
    return false;
  }
  
  return !!(user.email || (name && name !== 'unauthorized'));
}

/**
 * Gets sync status display text
 */
export function getSyncStatusText(status: SyncStatus | null | undefined): string {
  if (!status) return 'Pending';
  
  // Check for errors first
  if (status.error) {
    return 'Error';
  }
  
  // Check phase (Dexie Cloud uses 'phase' property)
  if (status.phase === 'in-sync') {
    if (status.status === 'connected') {
      return 'Synced';
    } else if (status.status === 'connecting') {
      return 'Connecting...';
    } else if (status.status === 'disconnected' || status.status === 'disconnecting') {
      return 'Disconnected';
    }
    return 'Syncing...';
  }
  
  if (status.phase === 'error') {
    return 'Error';
  }
  
  // Fallback to status property for backward compatibility
  if (status.status === 'connected') {
    return 'Connected';
  } else if (status.status === 'connecting') {
    return 'Connecting...';
  } else if (status.status === 'disconnected' || status.status === 'disconnecting') {
    return 'Disconnected';
  }
  
  return 'Pending';
}

/**
 * Gets sync status badge color classes
 */
export function getSyncStatusBadgeClasses(status: SyncStatus | null | undefined): string {
  if (!status) {
    return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
  }
  
  // Check for errors first
  if (status.error || status.phase === 'error') {
    return 'bg-red-500/20 text-red-600 dark:text-red-400';
  }
  
  // Check phase (Dexie Cloud uses 'phase' property)
  if (status.phase === 'in-sync') {
    if (status.status === 'connected') {
      return 'bg-green-500/20 text-green-600 dark:text-green-400';
    } else if (status.status === 'connecting') {
      return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
    } else if (status.status === 'disconnected' || status.status === 'disconnecting') {
      return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
    }
    return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
  }
  
  // Fallback to status property for backward compatibility
  if (status.status === 'connected') {
    return 'bg-green-500/20 text-green-600 dark:text-green-400';
  } else if (status.status === 'connecting') {
    return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
  } else if (status.status === 'disconnected' || status.status === 'disconnecting') {
    return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
  }
  
  return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
}

