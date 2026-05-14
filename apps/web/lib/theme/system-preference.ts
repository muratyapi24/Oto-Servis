/**
 * System preference detection utilities
 * 
 * This module provides utilities to detect and subscribe to the operating system's
 * color scheme preference using the prefers-color-scheme media query.
 * 
 * Validates: Requirements 2.1, 2.2, 2.4, 16.2
 */

import type { ThemeMode } from "./types";

/**
 * Get the current system color scheme preference
 * 
 * Uses the prefers-color-scheme media query to detect if the user's
 * operating system is set to dark mode or light mode.
 * 
 * @returns "dark" if system prefers dark mode, "light" otherwise
 * 
 * Error Handling:
 * - Returns "light" if running on server (window is undefined)
 * - Returns "light" if media query is not supported
 * - Returns "light" if any error occurs during detection
 * 
 * @example
 * const systemTheme = getSystemPreference();
 * console.log(systemTheme); // "dark" or "light"
 */
export function getSystemPreference(): ThemeMode {
  // Server-side rendering: default to light mode
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    // Check if matchMedia is supported (older browsers may not support it)
    if (!window.matchMedia) {
      console.warn("matchMedia is not supported in this browser");
      return "light";
    }

    // Query the system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Return dark if the media query matches, light otherwise
    return mediaQuery.matches ? "dark" : "light";
  } catch (error) {
    // Fallback to light mode if any error occurs
    console.warn("Failed to detect system preference:", error);
    return "light";
  }
}

/**
 * Subscribe to system color scheme preference changes
 * 
 * Listens for changes to the prefers-color-scheme media query and calls
 * the provided callback whenever the system preference changes.
 * 
 * @param callback - Function to call when system preference changes
 * @returns Cleanup function to remove the event listener
 * 
 * Error Handling:
 * - Returns no-op cleanup function if running on server
 * - Returns no-op cleanup function if media query is not supported
 * - Catches and logs errors during listener setup
 * 
 * @example
 * const unsubscribe = subscribeToSystemPreference((theme) => {
 *   console.log("System theme changed to:", theme);
 * });
 * 
 * // Later, when component unmounts:
 * unsubscribe();
 */
export function subscribeToSystemPreference(
  callback: (theme: ThemeMode) => void
): () => void {
  // Server-side rendering: return no-op cleanup function
  if (typeof window === "undefined") {
    return () => {};
  }

  try {
    // Check if matchMedia is supported
    if (!window.matchMedia) {
      console.warn("matchMedia is not supported in this browser");
      return () => {};
    }

    // Create media query listener
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Handler function that converts MediaQueryListEvent to ThemeMode
    const handler = (event: MediaQueryListEvent) => {
      callback(event.matches ? "dark" : "light");
    };

    // Add event listener
    // Note: Using addEventListener instead of deprecated addListener for better browser support
    mediaQuery.addEventListener("change", handler);

    // Return cleanup function
    return () => {
      try {
        mediaQuery.removeEventListener("change", handler);
      } catch (error) {
        // Silent fail on cleanup - listener may already be removed
        console.warn("Failed to remove system preference listener:", error);
      }
    };
  } catch (error) {
    // If setup fails, log error and return no-op cleanup
    console.warn("Failed to subscribe to system preference changes:", error);
    return () => {};
  }
}
