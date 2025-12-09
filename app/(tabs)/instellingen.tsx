import { useEffect, useState } from 'react';
import { StyleSheet, View, Switch, ScrollView, Dimensions, TextInput } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { loadSettings, saveSettings, type AppSettings } from '@/app/utils/settingsStorage';
import { COLORS } from '@/app/styles/colors';

const { width, height } = Dimensions.get('window');

// Carbon-fiber SVG background
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

export default function InstellingenScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    csvImportEnabled: true,
    showExerciseImages: true,
    bodyWeightKg: 75,
    defaultMET: 5,
    progressDaysBack: 180,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loaded = await loadSettings();
      setSettings(loaded);
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
  };

  const handleNumberChange = async (key: 'bodyWeightKg' | 'defaultMET' | 'progressDaysBack', value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) return; // Prevent negative values
    
    const updated = { ...settings, [key]: numValue };
    setSettings(updated);
    await saveSettings(updated);
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

          {/* Body Weight Input */}
          <View style={styles.inputItem}>
            <View style={styles.inputLabel}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Lichaamsgewicht</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Voor kcal berekening
              </ThemedText>
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

          {/* Default MET Input */}
          <View style={styles.inputItem}>
            <View style={styles.inputLabel}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Standaard MET Waarde</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Metabolic equivalent (standaard 5 voor strength training)
              </ThemedText>
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

          {/* Progress Days Back Input */}
          <View style={styles.inputItem}>
            <View style={styles.inputLabel}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Progressie Periode</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Aantal dagen terug voor progressie grafiek
              </ThemedText>
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

          {/* CSV Import Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>CSV Importeren</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Schakel CSV import in het Historie tab in of uit
              </ThemedText>
            </View>
            <Switch
              value={settings.csvImportEnabled}
              onValueChange={(value) => handleToggle('csvImportEnabled', value)}
              trackColor={{ false: COLORS.SURFACE, true: COLORS.ACCENT }}
              thumbColor={COLORS.TEXT_PRIMARY}
            />
          </View>

          {/* Exercise Images Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingLabel}>Oefening Afbeeldingen</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Toon afbeeldingen en tips tijdens workouts
              </ThemedText>
            </View>
            <Switch
              value={settings.showExerciseImages}
              onValueChange={(value) => handleToggle('showExerciseImages', value)}
              trackColor={{ false: COLORS.SURFACE, true: COLORS.ACCENT }}
              thumbColor={COLORS.TEXT_PRIMARY}
            />
          </View>
        </View>

        {/* Info Section */}
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

const styles = StyleSheet.create({
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
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SURFACE,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  infoBox: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ACCENT,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  inputItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SURFACE,
  },
  inputLabel: {
    marginBottom: 10,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 10,
    backgroundColor: COLORS.SURFACE,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  inputUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    minWidth: 40,
  },
});
