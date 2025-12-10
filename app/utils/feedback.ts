import { Alert } from 'react-native';

export interface SuccessMessage {
  title: string;
  message?: string;
  duration?: number;
}

/**
 * Show success feedback to user
 * Uses native Alert for simple feedback
 */
export async function showSuccess(title: string, message?: string) {
  return new Promise<void>((resolve) => {
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => resolve(),
      },
    ]);
  });
}

/**
 * Show error feedback
 */
export async function showError(title: string, message?: string) {
  return new Promise<void>((resolve) => {
    Alert.alert('❌ ' + title, message, [
      {
        text: 'OK',
        onPress: () => resolve(),
      },
    ]);
  });
}
