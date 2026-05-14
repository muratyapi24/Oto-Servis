/**
 * Theme system type definitions and constants
 * 
 * This module defines the core types and constants for the dark/light theme system.
 * It supports three theme modes: light, dark, and system (which follows OS preference).
 */

/**
 * Active theme mode - the actual theme being displayed
 * Can only be "light" or "dark"
 */
export type ThemeMode = "light" | "dark";

/**
 * User's theme preference - includes "system" option
 * - "light": Always use light theme
 * - "dark": Always use dark theme
 * - "system": Follow operating system preference
 */
export type ThemePreference = ThemeMode | "system";

/**
 * Theme context value exposed to components
 */
export interface ThemeContextValue {
  /** Current active theme (resolved from preference and system) */
  theme: ThemeMode;
  /** User's explicit preference (may be "system") */
  preference: ThemePreference;
  /** Function to update user's theme preference */
  setPreference: (preference: ThemePreference) => void;
  /** Whether theme is still being loaded from storage */
  isLoading: boolean;
}

/**
 * localStorage key for storing theme preference
 * Consistent across all application sections for unified experience
 */
export const THEME_STORAGE_KEY = "ms-otoservis-theme";

/**
 * All possible theme modes (active themes)
 */
export const THEME_MODES: ThemeMode[] = ["light", "dark"];

/**
 * All possible theme preferences (including system)
 */
export const THEME_PREFERENCES: ThemePreference[] = ["system", "light", "dark"];
