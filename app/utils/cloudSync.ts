import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession, PersonalRecord } from '@/app/types/workout';

const CLOUD_SYNC_KEY = 'cloud_sync_settings';
const SYNC_STATUS_KEY = 'sync_status';
const LAST_SYNC_KEY = 'last_sync_timestamp';

interface CloudSyncSettings {
  enabled: boolean;
  provider: 'supabase' | 'firebase' | 'none';
  supabaseUrl?: string;
  supabaseKey?: string;
  firebaseProjectId?: string;
  firebaseApiKey?: string;
  autoSync: boolean;
  syncInterval: number; // in minutes
  lastSync?: string;
}

interface SyncStatus {
  syncing: boolean;
  lastSuccess?: string;
  lastError?: string;
  pendingChanges: number;
}

const DEFAULT_SETTINGS: CloudSyncSettings = {
  enabled: false,
  provider: 'none',
  autoSync: true,
  syncInterval: 60, // Sync every 60 minutes
};

/**
 * Get current cloud sync settings
 */
export async function getCloudSyncSettings(): Promise<CloudSyncSettings> {
  try {
    const stored = await AsyncStorage.getItem(CLOUD_SYNC_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('Failed to load cloud sync settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save cloud sync settings
 */
export async function saveCloudSyncSettings(settings: Partial<CloudSyncSettings>): Promise<void> {
  try {
    const current = await getCloudSyncSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save cloud sync settings:', error);
    throw error;
  }
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const stored = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return stored ? JSON.parse(stored) : { syncing: false, pendingChanges: 0 };
  } catch (error) {
    console.warn('Failed to load sync status:', error);
    return { syncing: false, pendingChanges: 0 };
  }
}

/**
 * Update sync status
 */
export async function updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
  try {
    const current = await getSyncStatus();
    const updated = { ...current, ...status };
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to update sync status:', error);
  }
}

/**
 * Initialize Supabase client (stub for implementation)
 */
export async function initializeSupabaseSync(url: string, key: string): Promise<boolean> {
  try {
    // Validate URL and key format
    if (!url || !key) {
      throw new Error('Supabase URL and key are required');
    }

    // In a real implementation, this would initialize Supabase client
    // For now, we'll just validate and store the settings
    await saveCloudSyncSettings({
      enabled: true,
      provider: 'supabase',
      supabaseUrl: url,
      supabaseKey: key,
    });

    console.log('Supabase sync initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase sync:', error);
    throw error;
  }
}

/**
 * Initialize Firebase sync (stub for implementation)
 */
export async function initializeFirebaseSync(
  projectId: string,
  apiKey: string
): Promise<boolean> {
  try {
    if (!projectId || !apiKey) {
      throw new Error('Firebase Project ID and API Key are required');
    }

    await saveCloudSyncSettings({
      enabled: true,
      provider: 'firebase',
      firebaseProjectId: projectId,
      firebaseApiKey: apiKey,
    });

    console.log('Firebase sync initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase sync:', error);
    throw error;
  }
}

/**
 * Sync sessions to cloud
 */
export async function syncSessionsToCloud(sessions: WorkoutSession[]): Promise<boolean> {
  try {
    const settings = await getCloudSyncSettings();
    if (!settings.enabled) return false;

    await updateSyncStatus({ syncing: true });

    // Stub implementation - would integrate with actual cloud provider
    console.log(`Syncing ${sessions.length} sessions to ${settings.provider}`);

    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    await updateSyncStatus({
      syncing: false,
      lastSuccess: new Date().toISOString(),
      pendingChanges: 0,
    });

    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    return true;
  } catch (error) {
    console.error('Failed to sync sessions to cloud:', error);
    await updateSyncStatus({
      syncing: false,
      lastError: String(error),
    });
    return false;
  }
}

/**
 * Sync PRs to cloud
 */
export async function syncPRsToCloud(prs: Record<string, PersonalRecord>): Promise<boolean> {
  try {
    const settings = await getCloudSyncSettings();
    if (!settings.enabled) return false;

    await updateSyncStatus({ syncing: true });

    console.log(`Syncing ${Object.keys(prs).length} PRs to ${settings.provider}`);

    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 800));

    await updateSyncStatus({
      syncing: false,
      lastSuccess: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Failed to sync PRs to cloud:', error);
    await updateSyncStatus({
      syncing: false,
      lastError: String(error),
    });
    return false;
  }
}

/**
 * Sync all data to cloud
 */
export async function syncAllToCloud(
  sessions: WorkoutSession[],
  prs: Record<string, PersonalRecord>
): Promise<boolean> {
  try {
    const settings = await getCloudSyncSettings();
    if (!settings.enabled) return false;

    await updateSyncStatus({ syncing: true });

    // Sync both in parallel
    const [sessionsOk, prsOk] = await Promise.all([
      syncSessionsToCloud(sessions),
      syncPRsToCloud(prs),
    ]);

    const success = sessionsOk && prsOk;

    if (success) {
      await updateSyncStatus({
        syncing: false,
        lastSuccess: new Date().toISOString(),
        pendingChanges: 0,
      });
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    }

    return success;
  } catch (error) {
    console.error('Failed to sync all data:', error);
    await updateSyncStatus({
      syncing: false,
      lastError: String(error),
    });
    return false;
  }
}

/**
 * Check if auto-sync should be performed
 */
export async function shouldAutoSync(): Promise<boolean> {
  try {
    const settings = await getCloudSyncSettings();
    if (!settings.enabled || !settings.autoSync) return false;

    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (!lastSync) return true;

    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const minutesSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60);

    return minutesSinceSync >= settings.syncInterval;
  } catch (error) {
    console.warn('Error checking auto-sync condition:', error);
    return false;
  }
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SYNC_KEY);
  } catch (error) {
    console.warn('Failed to get last sync time:', error);
    return null;
  }
}

/**
 * Disable cloud sync
 */
export async function disableCloudSync(): Promise<void> {
  try {
    await saveCloudSyncSettings({
      enabled: false,
      provider: 'none',
    });
  } catch (error) {
    console.error('Failed to disable cloud sync:', error);
    throw error;
  }
}
