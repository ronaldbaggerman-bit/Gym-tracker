// Rewritten after merge conflict to restore full instellingen screen with theme toggle
import { useThemeColors } from '@/app/hooks/useThemeColors';
import { getColors } from '@/app/styles/colors';
import { loadSettings, saveSettings, type AppSettings } from '@/app/utils/settingsStorage';
import { ThemedText } from '@/components/themed-text';
import { useEffect, useMemo, useState } from 'react';
import { Alert, DeviceEventEmitter, Dimensions, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CarbonFiberSVG = () => (
  <Svg width={width} height={height} style={{ position: 'absolute' }}>
    <Defs>
      <Pattern id="carbon" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <Rect x="0" y="0" width="6" height="6" fill="#0A0A0C" />
        <Circle cx="1" cy="1" r="0.8" fill="#141416" />
        <Circle cx="4" cy="4" r="0.8" fill="#141416" />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#carbon)" />
  </Svg>
);

const getStyles = (COLORS: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.BACKGROUND,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.BORDER,
    },
    section: {
      marginTop: 24,
      marginHorizontal: 12,
      backgroundColor: COLORS.CARD,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.BORDER,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 16,
      marginBottom: 4,
      color: COLORS.TEXT_PRIMARY,
    },
    inputItem: {
      marginTop: 8,
      backgroundColor: COLORS.SURFACE,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: COLORS.BORDER,
      gap: 8,
    },
    inputLabel: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    numberInput: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderColor: COLORS.BORDER,
      borderRadius: 8,
      paddingHorizontal: 12,
      color: COLORS.TEXT_PRIMARY,
      backgroundColor: COLORS.CARD,
    },
    inputUnit: {
      fontSize: 15,
      color: COLORS.TEXT_SECONDARY,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.SURFACE,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: COLORS.BORDER,
    },
    settingContent: {
      flex: 1,
      paddingRight: 10,
    },
    settingLabel: {
      fontSize: 15,
      color: COLORS.TEXT_PRIMARY,
    },
    settingDescription: {
      fontSize: 12,
      color: COLORS.TEXT_SECONDARY,
      marginTop: 4,
    },
    infoBox: {
      backgroundColor: COLORS.SURFACE,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: COLORS.BORDER,
      gap: 4,
    },
    infoText: {
      fontSize: 14,
      color: COLORS.TEXT_PRIMARY,
    },
    infoSubtext: {
      fontSize: 12,
      color: COLORS.TEXT_SECONDARY,
    },
  });

export default function InstellingenScreen() {
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);
  const [settings, setSettings] = useState<AppSettings>({
    csvImportEnabled: true,
    showExerciseImages: true,
    bodyWeightKg: 75,
    defaultMET: 5,
    progressDaysBack: 180,
    themePreference: 'dark',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loaded = await loadSettings();
      setSettings({
        ...loaded,
        themePreference: loaded.themePreference ?? 'system',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof AppSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);
    Alert.alert('✅ Opgeslagen', `${key === 'csvImportEnabled' ? 'CSV Import' : 'Oefening Afbeeldingen'} bijgewerkt.`);
  };

  const handleThemeToggle = async (value: boolean) => {
    const preference: 'light' | 'dark' = value ? 'dark' : 'light';
    const updated = { ...settings, themePreference: preference };
    setSettings(updated);
    await saveSettings(updated);
    DeviceEventEmitter.emit('themePreferenceChanged', preference);
    Alert.alert('✅ Opgeslagen', `Thema ingesteld op ${preference === 'dark' ? 'donker' : 'licht'}.`);
  };

  const handleNumberChange = async (key: 'bodyWeightKg' | 'defaultMET' | 'progressDaysBack', value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) return;
    const updated = { ...settings, [key]: numValue };
    setSettings(updated);
    await saveSettings(updated);
    Alert.alert('✅ Opgeslagen', 'Instelling bijgewerkt.');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CarbonFiberSVG />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CarbonFiberSVG />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Instellingen</ThemedText>
        </View>

        {/* Body & Calories Section */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>💪 Lichaamsgegevens</ThemedText>

          <View style={styles.inputItem}>
            <View style={styles.inputLabel}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Lichaamsgewicht</ThemedText>
              <ThemedText style={styles.settingDescription}>Voor kcal berekening</ThemedText>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={String(settings.bodyWeightKg)}
                onChangeText={(value) => handleNumberChange('bodyWeightKg', value)}
                keyboardType="decimal-pad"
                placeholder="75"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
              <ThemedText style={styles.inputUnit}>kg</ThemedText>
            </View>
          </View>

          <View style={styles.inputItem}>
            <View style={styles.inputLabel}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Standaard MET Waarde</ThemedText>
              <ThemedText style={styles.settingDescription}>Metabolic equivalent (standaard 5 voor strength training)</ThemedText>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={String(settings.defaultMET)}
                onChangeText={(value) => handleNumberChange('defaultMET', value)}
                keyboardType="decimal-pad"
                placeholder="5"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
              <ThemedText style={styles.inputUnit}>MET</ThemedText>
            </View>
          </View>

          <View style={styles.inputItem}>
            <View style={styles.inputLabel}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Progressie Periode</ThemedText>
              <ThemedText style={styles.settingDescription}>Aantal dagen terug voor progressie grafiek</ThemedText>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.numberInput}
                value={String(settings.progressDaysBack)}
                onChangeText={(value) => handleNumberChange('progressDaysBack', value)}
                keyboardType="number-pad"
                placeholder="180"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
              <ThemedText style={styles.inputUnit}>dagen</ThemedText>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>⚙️ Functies</ThemedText>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Donkere modus</ThemedText>
              <ThemedText style={styles.settingDescription}>Schakel tussen licht en donker (overschrijft systeem)</ThemedText>
            </View>
            <Switch
              value={(settings.themePreference ?? 'system') === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: COLORS.SURFACE, true: COLORS.ACCENT }}
              thumbColor={COLORS.TEXT_PRIMARY}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>CSV Importeren</ThemedText>
              <ThemedText style={styles.settingDescription}>Schakel CSV import in het Historie tab in of uit</ThemedText>
            </View>
            <Switch
              value={settings.csvImportEnabled}
              onValueChange={(value) => handleToggle('csvImportEnabled', value)}
              trackColor={{ false: COLORS.SURFACE, true: COLORS.ACCENT }}
              thumbColor={COLORS.TEXT_PRIMARY}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Oefening Afbeeldingen</ThemedText>
              <ThemedText style={styles.settingDescription}>Toon afbeeldingen en tips tijdens workouts</ThemedText>
            </View>
            <Switch
              value={settings.showExerciseImages}
              onValueChange={(value) => handleToggle('showExerciseImages', value)}
              trackColor={{ false: COLORS.SURFACE, true: COLORS.ACCENT }}
              thumbColor={COLORS.TEXT_PRIMARY}
            />
          </View>
        </View>

        {/* Database Status */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>📊 Database Status</ThemedText>
          <TouchableOpacity
            style={[styles.inputItem, { marginBottom: 8 }]}
            onPress={async () => {
              const { loadSessionsFromDB } = await import('@/app/utils/database');
              const sessions = await loadSessionsFromDB();
              const msg = `SQLite sessies: ${sessions.length}\n\nExercises per sessie:\n${sessions.slice(0, 3).map(s => `- ${s.date}: ${s.schemaName} (${s.exercises?.length || 0} oefeningen)`).join('\n')}${sessions.length > 3 ? '\n...' : ''}`;
              Alert.alert('Database Info', msg);
            }}
          >
            <View style={styles.inputLabel}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Controleer SQLite Data</ThemedText>
              <ThemedText style={styles.settingDescription}>Tap om database sessies te zien</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>ℹ️ Over</ThemedText>
          <View style={styles.infoBox}>
            <ThemedText style={styles.infoText}>Gym-Track v1.0</ThemedText>
            <ThemedText style={styles.infoSubtext}>Fitness tracking app met workouts, statistieken en grafieken</ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
