const extendPalette = (base: {
  BACKGROUND: string;
  SURFACE: string;
  CARD: string;
  BORDER: string;
  MUTED: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  PRIMARY: string;
  ACCENT: string;
  DANGER: string;
}) => ({
  ...base,
  // Common aliases for legacy components
  accent: base.ACCENT,
  text: base.TEXT_PRIMARY,
  gray: base.TEXT_SECONDARY,
  darkBg: base.BACKGROUND,
  darkCard: base.CARD,
  border: base.BORDER,
});

export const COLORS_DARK = extendPalette({
  BACKGROUND: '#0E0E10',
  SURFACE: '#141416',
  CARD: '#1C1C1E',
  BORDER: '#2C2C2E',
  MUTED: '#8E8E93',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#EBEBF0',
  PRIMARY: '#34C759',
  ACCENT: '#007AFF',
  DANGER: '#FF3B30',
});

export const COLORS_LIGHT = extendPalette({
  BACKGROUND: '#FFFFFF',
  SURFACE: '#F9F9F9',
  CARD: '#F2F2F7',
  BORDER: '#E5E5EA',
  MUTED: '#6C6C70',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#3C3C43',
  PRIMARY: '#34C759',
  ACCENT: '#007AFF',
  DANGER: '#FF3B30',
});

export const COLORS = COLORS_DARK; // Default (overridden in useThemeColors)

export function getColors(colorScheme: 'light' | 'dark' | null): typeof COLORS_DARK {
  return colorScheme === 'light' ? COLORS_LIGHT : COLORS_DARK;
}
