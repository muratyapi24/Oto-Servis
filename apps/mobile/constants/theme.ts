export const Colors = {
  primary: '#00236f',
  primaryContainer: '#1e3a8a',
  secondary: '#006c49',
  secondaryContainer: '#6cf8bb',
  surface: '#f7f9fb',
  onSurface: '#191c1e',
  error: '#ba1a1a',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerLowest: '#ffffff',
  outline: '#757682',
  outlineVariant: '#c5c5d3',
} as const;

export const Radius = {
  sm: 8,
  md: 12,   // XL
  lg: 16,   // 2XL
  xl: 24,
} as const;

export const Shadow = {
  navy: {
    shadowColor: 'rgba(0,35,111,1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 4,
  },
} as const;

export const GradientCTA = ['#3B82F6', '#1E3A8A'] as const;
