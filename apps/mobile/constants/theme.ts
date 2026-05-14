export const Colors = {
  primary: '#00236f',
  primaryContainer: '#1e3a8a',
  secondary: '#006c49',
  secondaryContainer: '#6cf8bb',
  surface: '#f7f9fb',
  onSurface: '#191c1e',
  onSurfaceVariant: '#494a50',
  error: '#ba1a1a',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerLowest: '#ffffff',
  outline: '#757682',
  outlineVariant: '#c5c5d3',
} as const;

export const DarkColors = {
  primary: '#a8c7fa',
  primaryContainer: '#3b82f6',
  secondary: '#6cf8bb',
  secondaryContainer: '#006c49',
  surface: '#1a1c1e',
  onSurface: '#e3e3e3',
  onSurfaceVariant: '#c4c6cf',
  error: '#ffb4ab',
  surfaceContainerLow: '#1f2123',
  surfaceContainer: '#25272a',
  surfaceContainerHigh: '#2f3135',
  surfaceContainerLowest: '#0f1113',
  outline: '#8e9099',
  outlineVariant: '#44464f',
} as const;

export const Radius = {
  sm: 8,
  md: 12,   // XL
  lg: 16,   // 2XL
  xl: 24,
} as const;

export const Shadow = {
  sm: {
    shadowColor: 'rgba(0,35,111,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  navy: {
    shadowColor: 'rgba(0,35,111,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 4,
  },
} as const;

export const GradientCTA = ['#3B82F6', '#1E3A8A'] as const;

/**
 * Get theme-aware colors based on current theme mode
 * @param isDark - Whether dark mode is active
 * @returns Color palette for the current theme
 */
export function getThemeColors(isDark: boolean) {
  return isDark ? DarkColors : Colors;
}
