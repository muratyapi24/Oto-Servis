/**
 * Theme storage abstraction layer
 * 
 * This module provides an abstraction over localStorage for theme persistence.
 * It includes error handling for storage unavailability and validates stored values.
 * 
 * **Validates: Requirements 1.1, 1.2, 16.1, 16.4**
 */

import { THEME_STORAGE_KEY, THEME_PREFERENCES, type ThemePreference } from "./types";

/**
 * Abstract interface for theme storage operations
 * Allows different storage implementations (localStorage, SecureStore, etc.)
 */
export interface ThemeStorage {
  /**
   * Retrieve the stored theme preference
   * @returns The stored preference, or null if not found or invalid
   */
  get(): ThemePreference | null;
  
  /**
   * Store a theme preference
   * @param preference - The theme preference to store
   */
  set(preference: ThemePreference): void;
  
  /**
   * Remove the stored theme preference
   */
  remove(): void;
}

/**
 * localStorage-based theme storage implementation for web platform
 * 
 * Includes comprehensive error handling for:
 * - Storage unavailability (private browsing, quota exceeded)
 * - Invalid/corrupted stored values
 * - Security exceptions
 */
export class LocalStorageThemeStorage implements ThemeStorage {
  private key = THEME_STORAGE_KEY;
  
  /**
   * Retrieve theme preference from localStorage
   * 
   * **Validates: Requirements 1.2, 16.1, 16.4**
   * 
   * @returns Valid theme preference or null if:
   *   - localStorage is unavailable
   *   - No value is stored
   *   - Stored value is invalid/corrupted
   */
  get(): ThemePreference | null {
    try {
      const value = localStorage.getItem(this.key);
      
      // No stored value
      if (!value) {
        return null;
      }
      
      // Validate stored value (handles corrupted data)
      if (THEME_PREFERENCES.includes(value as ThemePreference)) {
        return value as ThemePreference;
      }
      
      // Invalid value - log warning and return null
      console.warn(`Invalid theme preference in storage: "${value}". Expected one of: ${THEME_PREFERENCES.join(", ")}`);
      return null;
    } catch (error) {
      // localStorage unavailable (private browsing, security restrictions, etc.)
      console.error("Failed to read theme preference from localStorage:", error);
      return null;
    }
  }
  
  /**
   * Store theme preference to localStorage
   * 
   * **Validates: Requirements 1.1, 16.1, 16.4**
   * 
   * @param preference - The theme preference to store
   * 
   * Fails silently if:
   * - localStorage is unavailable
   * - Quota is exceeded
   * - Security restrictions prevent access
   */
  set(preference: ThemePreference): void {
    try {
      localStorage.setItem(this.key, preference);
    } catch (error) {
      // Storage failed - log error but don't break the application
      // Theme will still work, just won't persist across sessions
      console.error("Failed to save theme preference to localStorage:", error);
    }
  }
  
  /**
   * Remove theme preference from localStorage
   * 
   * **Validates: Requirements 16.1, 16.4**
   * 
   * Fails silently if localStorage is unavailable
   */
  remove(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      // Silent fail - removal is not critical
      console.error("Failed to remove theme preference from localStorage:", error);
    }
  }
}
