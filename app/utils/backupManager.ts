import * as FileSystem from 'expo-file-system/legacy';
import { loadSessions, loadPRs } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKUP_DIRECTORY = `${FileSystem.documentDirectory}backups`;
const BACKUP_SCHEDULE_KEY = 'backup_schedule_settings';
const LAST_BACKUP_KEY = 'last_backup_timestamp';
const AUTO_BACKUP_ENABLED_KEY = 'auto_backup_enabled';

interface BackupScheduleSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  dayOfWeek?: number; // 0-6 (optional, for weekly backups)
  interval: 'daily' | 'weekly'; // Type of backup schedule
  maxBackups: number; // Maximum number of backups to keep
}

const DEFAULT_SCHEDULE: BackupScheduleSettings = {
  enabled: true,
  hour: 2, // 2 AM
  minute: 0,
  interval: 'daily',
  maxBackups: 7, // Keep last 7 daily backups
};

/**
 * Ensure backup directory exists
 */
async function ensureBackupDirectory(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIRECTORY, { intermediates: true });
    }
  } catch (error) {
    console.error('Failed to create backup directory:', error);
    throw error;
  }
}

/**
 * Get current backup schedule settings
 */
export async function getBackupSchedule(): Promise<BackupScheduleSettings> {
  try {
    const stored = await AsyncStorage.getItem(BACKUP_SCHEDULE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SCHEDULE;
  } catch (error) {
    console.warn('Failed to load backup schedule, using defaults:', error);
    return DEFAULT_SCHEDULE;
  }
}

/**
 * Save backup schedule settings
 */
export async function saveBackupSchedule(
  settings: Partial<BackupScheduleSettings>
): Promise<void> {
  try {
    const current = await getBackupSchedule();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(BACKUP_SCHEDULE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save backup schedule:', error);
    throw error;
  }
}

/**
 * Perform a backup of all session and PR data
 */
export async function performBackup(backupName?: string): Promise<string> {
  try {
    await ensureBackupDirectory();

    // Load all data
    const sessions = await loadSessions();
    const prs = await loadPRs();

    // Create backup object
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        sessions: sessions || [],
        prs: prs || {},
      },
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeString = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const filename = backupName || `backup_${timestamp}_${timeString}.json`;
    const filepath = `${BACKUP_DIRECTORY}/${filename}`;

    // Write backup file
    await FileSystem.writeAsStringAsync(filepath, JSON.stringify(backupData, null, 2));

    // Update last backup timestamp
    await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

    // Clean old backups
    await cleanOldBackups();

    return filepath;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

/**
 * Get list of all backups
 */
export async function listBackups(): Promise<Array<{ filename: string; timestamp: string; size: number }>> {
  try {
    await ensureBackupDirectory();
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIRECTORY);

    const backupFiles = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async filename => {
          const filepath = `${BACKUP_DIRECTORY}/${filename}`;
          const info = await FileSystem.getInfoAsync(filepath);
          return {
            filename,
            timestamp: info.modificationTime
              ? new Date(info.modificationTime * 1000).toISOString()
              : '',
            size: info.size || 0,
          };
        })
    );

    return backupFiles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.warn('Failed to list backups:', error);
    return [];
  }
}

/**
 * Delete old backups beyond the max limit
 */
async function cleanOldBackups(): Promise<void> {
  try {
    const schedule = await getBackupSchedule();
    const backups = await listBackups();

    if (backups.length > schedule.maxBackups) {
      const toDelete = backups.slice(schedule.maxBackups);
      for (const backup of toDelete) {
        const filepath = `${BACKUP_DIRECTORY}/${backup.filename}`;
        await FileSystem.deleteAsync(filepath);
      }
    }
  } catch (error) {
    console.warn('Failed to clean old backups:', error);
  }
}

/**
 * Restore from a backup file
 */
export async function restoreFromBackup(filepath: string): Promise<{ sessions: any[]; prs: Record<string, any> }> {
  try {
    const content = await FileSystem.readAsStringAsync(filepath);
    const backupData = JSON.parse(content);

    if (!backupData.data || !backupData.data.sessions) {
      throw new Error('Invalid backup file format');
    }

    return {
      sessions: backupData.data.sessions,
      prs: backupData.data.prs || {},
    };
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    throw error;
  }
}

/**
 * Get timestamp of last backup
 */
export async function getLastBackupTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_BACKUP_KEY);
  } catch (error) {
    console.warn('Failed to get last backup time:', error);
    return null;
  }
}

/**
 * Check if backup should be performed (based on schedule)
 */
export async function shouldPerformBackup(): Promise<boolean> {
  try {
    const schedule = await getBackupSchedule();
    if (!schedule.enabled) return false;

    const lastBackup = await getLastBackupTime();
    if (!lastBackup) return true; // Never backed up before

    const now = new Date();
    const lastBackupDate = new Date(lastBackup);
    const hoursSinceBackup = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);

    if (schedule.interval === 'daily') {
      // Check if 24 hours have passed and current time is past scheduled hour
      return (
        hoursSinceBackup >= 24 &&
        now.getHours() >= schedule.hour &&
        (now.getHours() > schedule.hour || now.getMinutes() >= schedule.minute)
      );
    } else {
      // Weekly backup: check day of week and time
      const scheduledDay = schedule.dayOfWeek ?? 0; // Default to Sunday
      const daysSinceBackup = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24);
      return (
        daysSinceBackup >= 7 &&
        now.getDay() === scheduledDay &&
        now.getHours() >= schedule.hour &&
        (now.getHours() > schedule.hour || now.getMinutes() >= schedule.minute)
      );
    }
  } catch (error) {
    console.warn('Error checking backup schedule:', error);
    return false;
  }
}

/**
 * Get formatted date string from timestamp
 */
export function formatBackupDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
