import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_MODE_KEY = 'offline_mode_enabled';
const LAST_ONLINE_TIME_KEY = 'last_online_timestamp';
const OFFLINE_DATA_KEY = 'offline_pending_data';

interface OfflineStatus {
  isOffline: boolean;
  lastOnlineTime: string | null;
  pendingDataCount: number;
}

let offlineStatusListeners: ((status: OfflineStatus) => void)[] = [];
let offlineCheckInterval: NodeJS.Timeout | null = null;

/**
 * Initialize offline detection
 */
export async function initializeOfflineDetection(callback?: (status: OfflineStatus) => void): Promise<void> {
  try {
    // Add listener callback if provided
    if (callback) {
      offlineStatusListeners.push(callback);
    }

    // Set initial online time
    const lastOnline = await AsyncStorage.getItem(LAST_ONLINE_TIME_KEY);
    if (!lastOnline) {
      await AsyncStorage.setItem(LAST_ONLINE_TIME_KEY, new Date().toISOString());
    }

    // Periodic check (every 30 seconds)
    if (offlineCheckInterval) clearInterval(offlineCheckInterval);
    
    offlineCheckInterval = setInterval(() => {
      getOfflineStatus().then(status => {
        offlineStatusListeners.forEach(listener => listener(status));
      });
    }, 30000);
  } catch (error) {
    console.warn('Failed to initialize offline detection:', error);
  }
}

/**
 * Get current offline status
 */
export async function getOfflineStatus(): Promise<OfflineStatus> {
  try {
    const lastOnlineTime = await AsyncStorage.getItem(LAST_ONLINE_TIME_KEY);
    const offlineData = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    const pendingData = offlineData ? JSON.parse(offlineData) : [];

    // Simple check: assume online (in real app, would use device network state)
    const isOffline = false; // Default to online unless explicitly set

    return {
      isOffline,
      lastOnlineTime,
      pendingDataCount: pendingData.length,
    };
  } catch (error) {
    console.warn('Failed to get offline status:', error);
    return {
      isOffline: false,
      lastOnlineTime: null,
      pendingDataCount: 0,
    };
  }
}

/**
 * Mark as offline
 */
export async function setOfflineMode(isOffline: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, JSON.stringify(isOffline));
  } catch (error) {
    console.warn('Failed to set offline mode:', error);
  }
}

/**
 * Subscribe to offline status changes
 */
export function subscribeToOfflineStatus(callback: (status: OfflineStatus) => void): () => void {
  offlineStatusListeners.push(callback);

  // Return unsubscribe function
  return () => {
    offlineStatusListeners = offlineStatusListeners.filter(l => l !== callback);
  };
}

/**
 * Add pending data for offline sync
 */
export async function addPendingData(dataType: string, data: any): Promise<void> {
  try {
    const offlineData = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    const pendingData = offlineData ? JSON.parse(offlineData) : [];

    pendingData.push({
      id: `${dataType}_${Date.now()}`,
      type: dataType,
      data,
      timestamp: new Date().toISOString(),
    });

    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(pendingData));
  } catch (error) {
    console.warn('Failed to add pending data:', error);
  }
}

/**
 * Get pending data for sync
 */
export async function getPendingData(): Promise<any[]> {
  try {
    const offlineData = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    return offlineData ? JSON.parse(offlineData) : [];
  } catch (error) {
    console.warn('Failed to get pending data:', error);
    return [];
  }
}

/**
 * Clear pending data after successful sync
 */
export async function clearPendingData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_DATA_KEY);
  } catch (error) {
    console.warn('Failed to clear pending data:', error);
  }
}

/**
 * Cleanup offline detection
 */
export function cleanupOfflineDetection(): void {
  if (offlineCheckInterval) {
    clearInterval(offlineCheckInterval);
    offlineCheckInterval = null;
  }
  offlineStatusListeners = [];
}

/**
 * Format last online time for display
 */
export function formatLastOnlineTime(isoString: string | null): string {
  if (!isoString) return 'Never';

  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('nl-NL');
  } catch {
    return 'Unknown';
  }
}
