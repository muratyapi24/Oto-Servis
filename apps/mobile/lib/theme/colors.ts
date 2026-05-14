/**
 * Theme-aware color system for mobile app
 * 
 * This module provides a function to get theme-aware colors based on the current theme mode.
 * It returns different color values for light and dark themes while maintaining the same API.
 * 
 * **Validates: Requirements 7.6**
 */

import type { ThemeMode } from "./types";

/**
 * Color palette for light and dark themes
 */
export interface ThemeColors {
  primary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  error: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerLowest: string;
  outline: string;
  outlineVariant: string;
}

/**
 * Light theme colors (existing colors)
 */
const lightColors: ThemeColors = {
  primary: "#00236f",
  primaryContainer: "#1e3a8a",
  secondary: "#006c49",
  secondaryContainer: "#6cf8bb",
  surface: "#f7f9fb",
  onSurface: "#191c1e",
  onSurfaceVariant: "#494a50",
  error: "#ba1a1a",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainer: "#eceef0",
  surfaceContainerHigh: "#e6e8ea",
  surfaceContainerLowest: "#ffffff",
  outline: "#757682",
  outlineVariant: "#c5c5d3",
};

/**
 * Dark theme colors (WCAG AA compliant)
 */
const darkColors: ThemeColors = {
  primary: "#a8c7fa",
  primaryContainer: "#3b82f6",
  secondary: "#6cf8bb",
  secondaryContainer: "#006c49",
  surface: "#1a1c1e",
  onSurface: "#e3e3e3",
  onSurfaceVariant: "#c4c6cf",
  error: "#ffb4ab",
  surfaceContainerLow: "#1f2123",
  surfaceContainer: "#25272a",
  surfaceContainerHigh: "#2f3133",
  surfaceContainerLowest: "#0f1113",
  outline: "#8e9099",
  outlineVariant: "#44464f",
};

/**
 * Get theme-aware colors based on current theme mode
 * 
 * **Validates: Requirements 7.6**
 * 
 * @param theme - Current theme mode ("light" or "dark")
 * @returns Theme-specific color palette
 * 
 * @example
 * const { theme } = useTheme();
 * const colors = getThemeColors(theme);
 * 
 * <View style={{ backgroundColor: colors.surface }}>
 *   <Text style={{ color: colors.onSurface }}>Hello</Text>
 * </View>
 */
export function getThemeColors(theme: ThemeMode): ThemeColors {
  return theme === "dark" ? darkColors : lightColors;
}
