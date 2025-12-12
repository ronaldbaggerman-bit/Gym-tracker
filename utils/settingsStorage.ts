import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings_v1';

export interface AppSettings {
  csvImportEnabled: boolean;
  showExerciseImages: boolean;
  bodyWeightKg: number;
  defaultMET: number;
  progressDaysBack: number;
  themePreference?: 'system' | 'light' | 'dark';
}

const DEFAULT_SETTINGS: AppSettings = {
  csvImportEnabled: true,
  showExerciseImages: true,
  bodyWeightKg: 75,
  defaultMET: 5,
  progressDaysBack: 180,
  themePreference: 'dark',
};

export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const updateSetting = async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> => {
  try {
    const current = await loadSettings();
    current[key] = value;
    await saveSettings(current);
  } catch (error) {
    console.error(`Failed to update setting ${String(key)}:`, error);
  }
};
