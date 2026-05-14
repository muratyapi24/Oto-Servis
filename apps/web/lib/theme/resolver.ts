/**
 * Theme resolution logic
 * 
 * This module handles theme resolution and validation.
 * It determines the active theme based on user preference and system preference.
 */

import type { ThemeMode, ThemePreference } from "./types";
import { THEME_PREFERENCES } from "./types";

/**
 * Resolves the active theme based on user preference and system preference
 * 
 * Resolution logic:
 * - If preference is "system", return the system preference
 * - If preference is "light" or "dark", return that explicit preference
 * 
 * **Validates: Requirements 2.1, 2.3, 4.1, 4.2, 16.3, 16.5**
 * 
 * @param preference - User's theme preference (light, dark, or system)
 * @param systemPreference - Operating system's theme preference (light or dark)
 * @returns The resolved active theme mode (light or dark)
 * 
 * @example
 * resolveTheme("system", "dark") // Returns "dark"
 * resolveTheme("light", "dark")  // Returns "light" (explicit preference overrides system)
 * resolveTheme("dark", "light")  // Returns "dark"
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPreference: ThemeMode
): ThemeMode {
  if (preference === "system") {
    return systemPreference;
  }
  return preference;
}

/**
 * Validates if a value is a valid theme preference
 * 
 * Checks if the provided value is one of the allowed theme preferences:
 * "light", "dark", or "system"
 * 
 * **Validates: Requirements 16.3, 16.5**
 * 
 * @param value - Value to validate (can be any type)
 * @returns The value as ThemePreference if valid, null otherwise
 * 
 * @example
 * validateThemePreference("dark")      // Returns "dark"
 * validateThemePreference("system")    // Returns "system"
 * validateThemePreference("invalid")   // Returns null
 * validateThemePreference(123)         // Returns null
 * validateThemePreference(null)        // Returns null
 */
export function validateThemePreference(
  value: unknown
): ThemePreference | null {
  if (typeof value === "string" && THEME_PREFERENCES.includes(value as ThemePreference)) {
    return value as ThemePreference;
  }
  return null;
}
