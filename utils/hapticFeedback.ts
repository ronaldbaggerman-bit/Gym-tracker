import * as Haptics from 'expo-haptics';

export async function lightHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

export async function mediumHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

export async function successHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

export async function warningHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

export async function errorHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}
