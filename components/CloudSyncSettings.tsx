import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { COLORS } from '@/app/styles/colors';
import {
  getCloudSyncSettings,
  saveCloudSyncSettings,
  initializeSupabaseSync,
  initializeFirebaseSync,
  syncAllToCloud,
  getSyncStatus,
  getLastSyncTime,
  disableCloudSync,
} from '@/app/utils/cloudSync';
import { loadSessions, loadPRs } from '@/app/utils/storage';

interface CloudSyncSettingsState {
  provider: 'supabase' | 'firebase' | 'none';
  supabaseUrl: string;
  supabaseKey: string;
  firebaseProjectId: string;
  firebaseApiKey: string;
  autoSync: boolean;
  syncInterval: number;
}

export function CloudSyncSettings() {
  const [settings, setSettings] = useState<CloudSyncSettingsState>({
    provider: 'none',
    supabaseUrl: '',
    supabaseKey: '',
    firebaseProjectId: '',
    firebaseApiKey: '',
    autoSync: true,
    syncInterval: 60,
  });

  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSuccess: null as string | null });
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await getCloudSyncSettings();
      setSettings({
        provider: saved.provider,
        supabaseUrl: saved.supabaseUrl || '',
        supabaseKey: saved.supabaseKey || '',
        firebaseProjectId: saved.firebaseProjectId || '',
        firebaseApiKey: saved.firebaseApiKey || '',
        autoSync: saved.autoSync,
        syncInterval: saved.syncInterval,
      });

      const status = await getSyncStatus();
      setSyncStatus(status as any);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (provider: 'supabase' | 'firebase' | 'none') => {
    if (provider === 'none') {
      try {
        await disableCloudSync();
        setSettings(prev => ({ ...prev, provider: 'none' }));
        Alert.alert('Success', 'Cloud sync disabled');
      } catch (error) {
        Alert.alert('Error', 'Failed to disable cloud sync');
      }
    } else {
      setSettings(prev => ({ ...prev, provider }));
    }
  };

  const handleSaveSupabase = async () => {
    if (!settings.supabaseUrl || !settings.supabaseKey) {
      Alert.alert('Error', 'Supabase URL and key are required');
      return;
    }

    try {
      await initializeSupabaseSync(settings.supabaseUrl, settings.supabaseKey);
      Alert.alert('Success', 'Supabase configuration saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save Supabase configuration');
    }
  };

  const handleSaveFirebase = async () => {
    if (!settings.firebaseProjectId || !settings.firebaseApiKey) {
      Alert.alert('Error', 'Firebase Project ID and API Key are required');
      return;
    }

    try {
      await initializeFirebaseSync(settings.firebaseProjectId, settings.firebaseApiKey);
      Alert.alert('Success', 'Firebase configuration saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save Firebase configuration');
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncStatus(prev => ({ ...prev, syncing: true }));
      const sessions = await loadSessions();
      const prs = await loadPRs();
      await syncAllToCloud(sessions || [], prs || {});
      await loadSettings();
      Alert.alert('Success', 'Data synced to cloud');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data: ' + String(error));
    } finally {
      setSyncStatus(prev => ({ ...prev, syncing: false }));
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('nl-NL', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {/* Provider Selection */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Cloud Provider</ThemedText>

        <View style={styles.providerButtons}>
          <TouchableOpacity
            style={[
              styles.providerButton,
              settings.provider === 'none' && styles.providerButtonActive,
            ]}
            onPress={() => handleToggleProvider('none')}
          >
            <ThemedText
              style={[
                styles.providerButtonText,
                settings.provider === 'none' && styles.providerButtonTextActive,
              ]}
            >
              None
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.providerButton,
              settings.provider === 'supabase' && styles.providerButtonActive,
            ]}
            onPress={() => handleToggleProvider('supabase')}
          >
            <ThemedText
              style={[
                styles.providerButtonText,
                settings.provider === 'supabase' && styles.providerButtonTextActive,
              ]}
            >
              Supabase
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.providerButton,
              settings.provider === 'firebase' && styles.providerButtonActive,
            ]}
            onPress={() => handleToggleProvider('firebase')}
          >
            <ThemedText
              style={[
                styles.providerButtonText,
                settings.provider === 'firebase' && styles.providerButtonTextActive,
              ]}
            >
              Firebase
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Supabase Configuration */}
      {settings.provider === 'supabase' && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Supabase Configuration</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Supabase URL</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="https://xxxx.supabase.co"
              placeholderTextColor={COLORS.gray}
              value={settings.supabaseUrl}
              onChangeText={(text) => setSettings(prev => ({ ...prev, supabaseUrl: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>Supabase Key</ThemedText>
              <TouchableOpacity onPress={() => setShowSecrets(!showSecrets)}>
                <ThemedText style={styles.toggleSecretText}>{showSecrets ? 'Hide' : 'Show'}</ThemedText>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="eyJxxxxx..."
              placeholderTextColor={COLORS.gray}
              value={settings.supabaseKey}
              onChangeText={(text) => setSettings(prev => ({ ...prev, supabaseKey: text }))}
              secureTextEntry={!showSecrets}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSupabase}>
            <ThemedText style={styles.saveButtonText}>Save Supabase Config</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Firebase Configuration */}
      {settings.provider === 'firebase' && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Firebase Configuration</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Project ID</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="my-project-123"
              placeholderTextColor={COLORS.gray}
              value={settings.firebaseProjectId}
              onChangeText={(text) => setSettings(prev => ({ ...prev, firebaseProjectId: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>API Key</ThemedText>
              <TouchableOpacity onPress={() => setShowSecrets(!showSecrets)}>
                <ThemedText style={styles.toggleSecretText}>{showSecrets ? 'Hide' : 'Show'}</ThemedText>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="AIzaSyD..."
              placeholderTextColor={COLORS.gray}
              value={settings.firebaseApiKey}
              onChangeText={(text) => setSettings(prev => ({ ...prev, firebaseApiKey: text }))}
              secureTextEntry={!showSecrets}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveFirebase}>
            <ThemedText style={styles.saveButtonText}>Save Firebase Config</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Sync Settings */}
      {settings.provider !== 'none' && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sync Settings</ThemedText>

          <View style={styles.settingRow}>
            <ThemedText style={styles.label}>Auto Sync</ThemedText>
            <TouchableOpacity
              style={[styles.toggle, { backgroundColor: settings.autoSync ? COLORS.accent : COLORS.gray }]}
              onPress={() => setSettings(prev => ({ ...prev, autoSync: !prev.autoSync }))}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: settings.autoSync ? 28 : 2 }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          {settings.autoSync && (
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Sync Interval: {settings.syncInterval} minutes</ThemedText>
              <View style={styles.sliderContainer}>
                <TouchableOpacity onPress={() => setSettings(prev => ({ ...prev, syncInterval: Math.max(5, prev.syncInterval - 10) }))}>
                  <ThemedText style={styles.button}>−</ThemedText>
                </TouchableOpacity>
                <View style={styles.sliderValue}>
                  <ThemedText>{settings.syncInterval} min</ThemedText>
                </View>
                <TouchableOpacity onPress={() => setSettings(prev => ({ ...prev, syncInterval: Math.min(1440, prev.syncInterval + 10) }))}>
                  <ThemedText style={styles.button}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.syncButton, syncStatus.syncing && { opacity: 0.6 }]}
            onPress={handleManualSync}
            disabled={syncStatus.syncing}
          >
            {syncStatus.syncing ? (
              <ActivityIndicator size="small" color={COLORS.darkBg} />
            ) : (
              <ThemedText style={styles.syncButtonText}>Sync Now</ThemedText>
            )}
          </TouchableOpacity>

          {syncStatus.lastSuccess && (
            <ThemedText style={styles.syncStatus}>
              Last sync: {formatLastSync(syncStatus.lastSuccess)}
            </ThemedText>
          )}
        </View>
      )}

      {settings.provider === 'none' && (
        <View style={styles.section}>
          <ThemedText style={styles.infoText}>
            Cloud sync is disabled. Select a provider above to enable automatic backup and synchronization of your workout data.
          </ThemedText>
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
  providerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
  },
  providerButtonActive: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}20`,
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
  },
  providerButtonTextActive: {
    color: COLORS.accent,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.darkBg,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleSecretText: {
    fontSize: 12,
    color: COLORS.accent,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.darkBg,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderValue: {
    flex: 1,
    alignItems: 'center',
  },
  button: {
    fontSize: 18,
    color: COLORS.accent,
    paddingVertical: 4,
  },
  syncButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  syncButtonText: {
    color: COLORS.darkBg,
    fontWeight: '600',
  },
  syncStatus: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
});
