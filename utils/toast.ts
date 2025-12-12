import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
}

let toastTimer: NodeJS.Timeout | null = null;

export function showToast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
) {
  const { duration = 2000 } = options;

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  const title = `${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  Alert.alert(title, message, [
    {
      text: 'OK',
      style: 'default',
      onPress: () => {},
    },
  ]);

  toastTimer = setTimeout(() => {}, duration);
}

export const Toast = {
  success: (message: string, duration?: number) =>
    showToast(message, 'success', { duration }),
  error: (message: string, duration?: number) =>
    showToast(message, 'error', { duration }),
  info: (message: string, duration?: number) =>
    showToast(message, 'info', { duration }),
  warning: (message: string, duration?: number) =>
    showToast(message, 'warning', { duration }),
};
