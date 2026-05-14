/**
 * System preference detection for React Native
 * 
 * This module provides functions to detect and subscribe to the operating system's
 * color scheme preference using React Native's Appearance API.
 * 
 * Requirements:
 * - 7.5: Mobile app SHALL update theme when system preference changes if user preference is "system"
 * - 2.1: Theme system SHALL detect system preference using prefers-color-scheme (Appearance API on mobile)
 * - 2.2: Theme system SHALL listen for system preference changes in real-time
 * - 2.4: Theme system SHALL listen for prefers-color-scheme media query changes (Appearance changes on mobile)
 */

import { Appearance } from "react-native";
import type { ThemeMode } from "./types";

/**
 * Get the current system color scheme preference
 * 
 * Uses React Native's Appearance.getColorScheme() to detect the OS-level
 * color scheme preference. Defaults to "light" if detection fails or returns null.
 * 
 * @returns {ThemeMode} "dark" if system prefers dark mode, "light" otherwise
 * 
 * @example
 * const systemTheme = getSystemPreference();
 * console.log(systemTheme); // "dark" or "light"
 */
export function getSystemPreference(): ThemeMode {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === "dark" ? "dark" : "light";
}

/**
 * Subscribe to system color scheme preference changes
 * 
 * Registers a listener for OS-level color scheme changes using
 * Appearance.addChangeListener(). The callback is invoked whenever
 * the system switches between light and dark mode.
 * 
 * @param {Function} callback - Function called when system preference changes
 * @returns {Function} Cleanup function to remove the listener
 * 
 * @example
 * const unsubscribe = subscribeToSystemPreference((newTheme) => {
 *   console.log("System theme changed to:", newTheme);
 * });
 * 
 * // Later, cleanup:
 * unsubscribe();
 */
export function subscribeToSystemPreference(
  callback: (theme: ThemeMode) => void
): () => void {
  const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    callback(colorScheme === "dark" ? "dark" : "light");
  });
  
  return () => subscription.remove();
}
