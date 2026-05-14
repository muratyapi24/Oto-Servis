/**
 * Theme-Aware Style Utilities for Mobile
 * 
 * This module provides utility functions to generate theme-aware styles for React Native components.
 * These utilities use the useTheme() hook to get the current theme and apply conditional styles.
 * 
 * **Validates: Requirements 7.6**
 * 
 * @example
 * import { useThemedStyles, createThemedStyles } from '@/lib/theme/styles';
 * 
 * function MyComponent() {
 *   const styles = useThemedStyles(styleCreator);
 *   return <View style={styles.container} />;
 * }
 * 
 * const styleCreator = createThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     color: theme.colors.text,
 *   },
 * }));
 */

import { useMemo } from "react";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { useTheme } from "@/components/theme-provider";
import type { ThemeMode } from "./types";

/**
 * Theme color palette
 * Defines colors for both light and dark themes
 */
export interface ThemeColors {
  // Surface colors
  background: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Brand colors
  primary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  
  // Semantic colors
  error: string;
  success: string;
  warning: string;
  info: string;
  
  // Border and outline colors
  border: string;
  outline: string;
  outlineVariant: string;
  
  // Shadow color
  shadow: string;
}

/**
 * Complete theme object with colors and mode
 */
export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

/**
 * Light theme color palette
 */
const lightColors: ThemeColors = {
  // Surface colors
  background: "#f7f9fb",
  surface: "#f7f9fb",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainer: "#eceef0",
  surfaceContainerHigh: "#e6e8ea",
  
  // Text colors
  text: "#191c1e",
  textSecondary: "#494a50",
  textTertiary: "#757682",
  
  // Brand colors
  primary: "#00236f",
  primaryContainer: "#1e3a8a",
  secondary: "#006c49",
  secondaryContainer: "#6cf8bb",
  
  // Semantic colors
  error: "#ba1a1a",
  success: "#006c49",
  warning: "#f59e0b",
  info: "#3b82f6",
  
  // Border and outline colors
  border: "#e6e8ea",
  outline: "#757682",
  outlineVariant: "#c5c5d3",
  
  // Shadow color
  shadow: "rgba(0, 35, 111, 1)",
};

/**
 * Dark theme color palette
 */
const darkColors: ThemeColors = {
  // Surface colors
  background: "#0f1419",
  surface: "#1a1f26",
  surfaceContainerLowest: "#0a0e13",
  surfaceContainerLow: "#191c1e",
  surfaceContainer: "#1d2024",
  surfaceContainerHigh: "#272a2e",
  
  // Text colors
  text: "#e3e5e8",
  textSecondary: "#c5c7ca",
  textTertiary: "#8e9099",
  
  // Brand colors
  primary: "#a8c7fa",
  primaryContainer: "#3b82f6",
  secondary: "#6cf8bb",
  secondaryContainer: "#00a876",
  
  // Semantic colors
  error: "#ffb4ab",
  success: "#6cf8bb",
  warning: "#fbbf24",
  info: "#93c5fd",
  
  // Border and outline colors
  border: "#2d3139",
  outline: "#8e9099",
  outlineVariant: "#43464e",
  
  // Shadow color
  shadow: "rgba(0, 0, 0, 0.8)",
};

/**
 * Get theme colors based on theme mode
 * 
 * @param mode - Current theme mode ("light" or "dark")
 * @returns Theme colors for the specified mode
 */
export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? darkColors : lightColors;
}

/**
 * Get complete theme object
 * 
 * @param mode - Current theme mode ("light" or "dark")
 * @returns Complete theme object with mode and colors
 */
export function getTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: getThemeColors(mode),
  };
}

/**
 * Style creator function type
 * Takes a theme and returns a style object
 */
export type StyleCreator<T> = (theme: Theme) => T;

/**
 * Named styles type - object with named style properties
 */
export type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Create themed styles hook
 * 
 * This is the primary utility for creating theme-aware styles.
 * It memoizes the style creation to prevent unnecessary recalculations.
 * 
 * **Validates: Requirements 7.6**
 * 
 * @param styleCreator - Function that takes a theme and returns styles
 * @returns Memoized styles based on current theme
 * 
 * @example
 * function MyComponent() {
 *   const styles = useThemedStyles(createStyles);
 *   return <View style={styles.container} />;
 * }
 * 
 * const createStyles = (theme: Theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: 16,
 *   },
 *   text: {
 *     color: theme.colors.text,
 *     fontSize: 16,
 *   },
 * });
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  styleCreator: StyleCreator<T>
): T {
  const { theme: themeMode } = useTheme();
  
  return useMemo(() => {
    const theme = getTheme(themeMode);
    return styleCreator(theme);
  }, [themeMode, styleCreator]);
}

/**
 * Create a themed style creator function
 * 
 * This is a helper to create properly typed style creator functions.
 * It doesn't do anything at runtime, just provides type safety.
 * 
 * @param styleCreator - Function that takes a theme and returns styles
 * @returns The same style creator function with proper typing
 * 
 * @example
 * const createStyles = createThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *   },
 * }));
 * 
 * function MyComponent() {
 *   const styles = useThemedStyles(createStyles);
 *   return <View style={styles.container} />;
 * }
 */
export function createThemedStyles<T extends NamedStyles<T>>(
  styleCreator: StyleCreator<T>
): StyleCreator<T> {
  return styleCreator;
}

/**
 * Hook to get current theme object
 * 
 * Use this when you need direct access to theme colors in your component logic,
 * not just in styles.
 * 
 * **Validates: Requirements 7.6**
 * 
 * @returns Current theme object with mode and colors
 * 
 * @example
 * function MyComponent() {
 *   const theme = useThemeObject();
 *   
 *   return (
 *     <View>
 *       <Text style={{ color: theme.colors.text }}>
 *         Current mode: {theme.mode}
 *       </Text>
 *     </View>
 *   );
 * }
 */
export function useThemeObject(): Theme {
  const { theme: themeMode } = useTheme();
  
  return useMemo(() => getTheme(themeMode), [themeMode]);
}

/**
 * Hook to get current theme colors
 * 
 * Convenience hook that returns just the colors object.
 * 
 * **Validates: Requirements 7.6**
 * 
 * @returns Current theme colors
 * 
 * @example
 * function MyComponent() {
 *   const colors = useThemeColors();
 *   
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.text }}>Hello</Text>
 *     </View>
 *   );
 * }
 */
export function useThemeColors(): ThemeColors {
  const { theme: themeMode } = useTheme();
  
  return useMemo(() => getThemeColors(themeMode), [themeMode]);
}

/**
 * Conditional style helper
 * 
 * Returns one of two style objects based on the current theme mode.
 * Useful for simple conditional styling without creating a full style creator.
 * 
 * **Validates: Requirements 7.6**
 * 
 * @param lightStyle - Style to use in light mode
 * @param darkStyle - Style to use in dark mode
 * @returns The appropriate style based on current theme
 * 
 * @example
 * function MyComponent() {
 *   const { theme } = useTheme();
 *   const containerStyle = useConditionalStyle(
 *     { backgroundColor: '#fff' },
 *     { backgroundColor: '#000' }
 *   );
 *   
 *   return <View style={containerStyle} />;
 * }
 */
export function useConditionalStyle<T extends ViewStyle | TextStyle | ImageStyle>(
  lightStyle: T,
  darkStyle: T
): T {
  const { theme: themeMode } = useTheme();
  
  return useMemo(
    () => (themeMode === "dark" ? darkStyle : lightStyle),
    [themeMode, lightStyle, darkStyle]
  );
}

/**
 * Get shadow style based on theme
 * 
 * Returns appropriate shadow configuration for the current theme.
 * Dark mode uses darker, more subtle shadows.
 * 
 * @param elevation - Shadow elevation level ("sm" or "md")
 * @param themeMode - Current theme mode
 * @returns Shadow style object
 */
export function getThemedShadow(
  elevation: "sm" | "md",
  themeMode: ThemeMode
): ViewStyle {
  const shadowColor = themeMode === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 35, 111, 1)";
  
  if (elevation === "sm") {
    return {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: themeMode === "dark" ? 0.3 : 0.04,
      shadowRadius: 10,
      elevation: 2,
    };
  }
  
  // md elevation
  return {
    shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: themeMode === "dark" ? 0.4 : 0.05,
    shadowRadius: 25,
    elevation: 4,
  };
}

/**
 * Hook to get themed shadow style
 * 
 * **Validates: Requirements 7.6**
 * 
 * @param elevation - Shadow elevation level ("sm" or "md")
 * @returns Themed shadow style
 * 
 * @example
 * function MyCard() {
 *   const shadow = useThemedShadow("md");
 *   
 *   return (
 *     <View style={[styles.card, shadow]}>
 *       <Text>Card content</Text>
 *     </View>
 *   );
 * }
 */
export function useThemedShadow(elevation: "sm" | "md"): ViewStyle {
  const { theme: themeMode } = useTheme();
  
  return useMemo(
    () => getThemedShadow(elevation, themeMode),
    [elevation, themeMode]
  );
}
