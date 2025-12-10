import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings_v1';

export interface AppSettings {
  csvImportEnabled: boolean;
  showExerciseImages: boolean;
  bodyWeightKg: number; // User's body weight in kg
  defaultMET: number;   // Default metabolic equivalent for exercises
  progressDaysBack: number; // Days back to show in progression graph (180 default)
  themePreference?: 'system' | 'light' | 'dark'; // Optional theme preference
}

const DEFAULT_SETTINGS: AppSettings = {
  csvImportEnabled: true,
  showExerciseImages: true,
  bodyWeightKg: 75, // Default 75 kg
  defaultMET: 5,    // Default MET value
  progressDaysBack: 180, // Default 180 days
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
