import { getColors } from '@/app/styles/colors';
import { loadSettings } from '@/utils/settingsStorage';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter, useColorScheme } from 'react-native';

/**
 * Hook om dynamische kleuren te krijgen gebaseerd op device theme (light/dark mode)
 * Automatisch responsief op system preferences
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  const [preference, setPreference] = useState<'system' | 'light' | 'dark'>('system');

  useEffect(() => {
    loadSettings()
      .then(settings => setPreference(settings.themePreference ?? 'system'))
      .catch(() => setPreference('system'));
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('themePreferenceChanged', (pref: 'system' | 'light' | 'dark') => {
      setPreference(pref);
    });
    return () => sub.remove();
  }, []);

  const effectiveScheme = preference === 'system' ? colorScheme : preference;
  return getColors(effectiveScheme);
}
