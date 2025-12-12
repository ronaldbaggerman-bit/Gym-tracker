import { Alert } from 'react-native';

export interface SuccessMessage {
  title: string;
  message?: string;
  duration?: number;
}

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
