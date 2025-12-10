import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility functions
 * Following HIG guidelines: use sparingly for important moments
 */

/**
 * Light feedback for standard interactions (default)
 */
export async function lightHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (err) {
    // Haptics may not be available on all devices
    console.warn('Haptic feedback failed:', err);
  }
}

/**
 * Medium feedback for important actions
 */
export async function mediumHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

/**
 * Success feedback for achievements (PR, workout completion)
 */
export async function successHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

/**
 * Warning feedback for destructive actions
 */
export async function warningHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}

/**
 * Error feedback for failed actions
 */
export async function errorHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (err) {
    console.warn('Haptic feedback failed:', err);
  }
}
