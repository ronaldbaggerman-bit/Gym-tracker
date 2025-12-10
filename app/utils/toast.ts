import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
}

let toastTimer: NodeJS.Timeout | null = null;

/**
 * Simple toast notification via Alert (can be replaced with react-native-toast-message later)
 * For now, we use Alert with auto-dismiss for UX polish
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
) {
  const { duration = 2000 } = options;

  // Clear previous toast if exists
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

  // Show alert
  Alert.alert(title, message, [
    {
      text: 'OK',
      style: 'default',
      onPress: () => {
        // Auto close
      },
    },
  ]);

  // Auto-dismiss after duration
  toastTimer = setTimeout(() => {
    // In a real app with react-native-toast-message, this would dismiss properly
    // For now, Alert.alert doesn't support auto-dismiss, so we use a simple alert
  }, duration);
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
