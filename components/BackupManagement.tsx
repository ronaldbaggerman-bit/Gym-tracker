import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { COLORS } from '@/app/styles/colors';
import {
  getBackupSchedule,
  saveBackupSchedule,
  performBackup,
  listBackups,
  getLastBackupTime,
  formatBackupDate,
  formatFileSize,
  restoreFromBackup,
  shouldPerformBackup,
} from '@/app/utils/backupManager';
import { saveSessionsList, savePR, loadPRs } from '@/app/utils/storage';
import * as FileSystem from 'expo-file-system/legacy';

interface BackupFile {
  filename: string;
  timestamp: string;
  size: number;
}

export function BackupManagement() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [backupHour, setBackupHour] = useState(2);
  const [backupMinute, setBackupMinute] = useState(0);
  const [maxBackups, setMaxBackups] = useState(7);
  const [loading, setLoading] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [performingBackup, setPerformingBackup] = useState(false);

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      setLoading(true);
      const schedule = await getBackupSchedule();
      const backupList = await listBackups();
      const lastBackup = await getLastBackupTime();

      setIsEnabled(schedule.enabled);
      setBackupHour(schedule.hour);
      setBackupMinute(schedule.minute);
      setMaxBackups(schedule.maxBackups);
      setBackups(backupList);
      setLastBackupTime(lastBackup);
    } catch (error) {
      console.error('Failed to load backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBackup = async (enabled: boolean) => {
    try {
      setIsEnabled(enabled);
      await saveBackupSchedule({ enabled });
    } catch (error) {
      Alert.alert('Error', 'Failed to update backup settings');
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      await saveBackupSchedule({
        hour: backupHour,
        minute: backupMinute,
        maxBackups,
      });
      Alert.alert('Success', 'Backup schedule updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const handleManualBackup = async () => {
    try {
      setPerformingBackup(true);
      await performBackup();
      await loadBackupData();
      Alert.alert('Success', 'Backup completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create backup: ' + String(error));
    } finally {
      setPerformingBackup(false);
    }
  };

  const handleRestoreBackup = (backup: BackupFile) => {
    Alert.alert(
      'Restore Backup',
      `Are you sure you want to restore backup from ${formatBackupDate(backup.timestamp)}?\n\nThis will replace your current data.`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              const backupDir = `${FileSystem.documentDirectory}backups`;
              const filepath = `${backupDir}/${backup.filename}`;
              const restored = await restoreFromBackup(filepath);

              // Apply restored data
              await saveSessionsList(restored.sessions);
              if (restored.prs && Object.keys(restored.prs).length > 0) {
                for (const [exerciseName, pr] of Object.entries(restored.prs)) {
                  await savePR(exerciseName, pr as any);
                }
              }

              Alert.alert('Success', 'Backup restored successfully');
              await loadBackupData();
            } catch (error) {
              Alert.alert('Error', 'Failed to restore backup: ' + String(error));
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteBackup = (backup: BackupFile) => {
    Alert.alert(
      'Delete Backup',
      `Are you sure you want to delete backup from ${formatBackupDate(backup.timestamp)}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const backupDir = `${FileSystem.documentDirectory}backups`;
              const filepath = `${backupDir}/${backup.filename}`;
              await FileSystem.deleteAsync(filepath);
              await loadBackupData();
              Alert.alert('Success', 'Backup deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete backup');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Settings Section */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Backup Settings</ThemedText>

        <View style={styles.settingItem}>
          <ThemedText style={styles.label}>Auto Backup</ThemedText>
          <TouchableOpacity
            style={[styles.toggle, { backgroundColor: isEnabled ? COLORS.accent : COLORS.gray }]}
            onPress={() => handleToggleBackup(!isEnabled)}
          >
            <View
              style={[
                styles.toggleThumb,
                { transform: [{ translateX: isEnabled ? 28 : 2 }] },
              ]}
            />
          </TouchableOpacity>
        </View>

        {isEnabled && (
          <>
            <View style={styles.timeInputContainer}>
              <ThemedText style={styles.label}>Backup Time</ThemedText>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInput}>
                  <ThemedText style={styles.timeValue}>{backupHour.toString().padStart(2, '0')}</ThemedText>
                  <TouchableOpacity onPress={() => setBackupHour((h) => (h + 1) % 24)}>
                    <ThemedText style={styles.button}>+</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setBackupHour((h) => (h - 1 + 24) % 24)}>
                    <ThemedText style={styles.button}>-</ThemedText>
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.separator}>:</ThemedText>
                <View style={styles.timeInput}>
                  <ThemedText style={styles.timeValue}>{backupMinute.toString().padStart(2, '0')}</ThemedText>
                  <TouchableOpacity onPress={() => setBackupMinute((m) => (m + 15) % 60)}>
                    <ThemedText style={styles.button}>+</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setBackupMinute((m) => (m - 15 + 60) % 60)}>
                    <ThemedText style={styles.button}>-</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.settingItem}>
              <ThemedText style={styles.label}>Max Backups: {maxBackups}</ThemedText>
              <View style={styles.sliderContainer}>
                <TouchableOpacity onPress={() => setMaxBackups(Math.max(1, maxBackups - 1))}>
                  <ThemedText style={styles.button}>−</ThemedText>
                </TouchableOpacity>
                <View style={styles.sliderValue}>
                  <ThemedText>{maxBackups} backups</ThemedText>
                </View>
                <TouchableOpacity onPress={() => setMaxBackups(Math.min(30, maxBackups + 1))}>
                  <ThemedText style={styles.button}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateSchedule}>
              <ThemedText style={styles.updateButtonText}>Save Schedule</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Manual Backup Section */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Manual Backup</ThemedText>
        <TouchableOpacity
          style={[styles.backupButton, performingBackup && { opacity: 0.6 }]}
          onPress={handleManualBackup}
          disabled={performingBackup}
        >
          {performingBackup ? (
            <ActivityIndicator size="small" color={COLORS.darkBg} />
          ) : (
            <ThemedText style={styles.backupButtonText}>Create Backup Now</ThemedText>
          )}
        </TouchableOpacity>

        {lastBackupTime && (
          <ThemedText style={styles.lastBackupText}>
            Last backup: {formatBackupDate(lastBackupTime)}
          </ThemedText>
        )}
      </View>

      {/* Backups List */}
      {backups.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Available Backups ({backups.length})</ThemedText>

          {backups.map((backup, index) => (
            <View key={index} style={styles.backupItem}>
              <View style={styles.backupInfo}>
                <ThemedText style={styles.backupName}>{backup.filename}</ThemedText>
                <ThemedText style={styles.backupDetails}>
                  {formatBackupDate(backup.timestamp)} • {formatFileSize(backup.size)}
                </ThemedText>
              </View>
              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRestoreBackup(backup)}
                >
                  <ThemedText style={styles.actionButtonText}>↻</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteBackup(backup)}
                >
                  <ThemedText style={styles.deleteButtonText}>✕</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.darkBg,
  },
  timeInputContainer: {
    marginBottom: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    alignItems: 'center',
    flex: 1,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  button: {
    fontSize: 18,
    color: COLORS.accent,
    paddingVertical: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderValue: {
    flex: 1,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: COLORS.darkBg,
    fontWeight: '600',
  },
  backupButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  backupButtonText: {
    color: COLORS.darkBg,
    fontWeight: '600',
    fontSize: 16,
  },
  lastBackupText: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  backupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBg,
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  backupDetails: {
    fontSize: 12,
    color: COLORS.gray,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
  },
  actionButtonText: {
    color: COLORS.darkBg,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
});
