/**
 * Theme storage abstraction layer for mobile
 * 
 * This module provides an abstraction over Expo SecureStore for theme persistence.
 * It includes error handling for storage unavailability and validates stored values.
 * 
 * **Validates: Requirements 7.2, 16.1, 16.4**
 */

import * as SecureStore from "expo-secure-store";
import { THEME_STORAGE_KEY, THEME_PREFERENCES, type ThemePreference } from "./types";

/**
 * Abstract interface for theme storage operations
 * Allows different storage implementations (localStorage, SecureStore, etc.)
 */
export interface ThemeStorage {
  /**
   * Retrieve the stored theme preference
   * @returns Promise resolving to the stored preference, or null if not found or invalid
   */
  get(): Promise<ThemePreference | null>;
  
  /**
   * Store a theme preference
   * @param preference - The theme preference to store
   * @returns Promise that resolves when storage is complete
   */
  set(preference: ThemePreference): Promise<void>;
  
  /**
   * Remove the stored theme preference
   * @returns Promise that resolves when removal is complete
   */
  remove(): Promise<void>;
}

/**
 * SecureStore-based theme storage implementation for mobile platform
 * 
 * Includes comprehensive error handling for:
 * - Storage unavailability (permissions, device restrictions)
 * - Invalid/corrupted stored values
 * - Storage quota exceeded
 * - Security exceptions
 */
export class SecureStoreThemeStorage implements ThemeStorage {
  private key = THEME_STORAGE_KEY;
  
  /**
   * Retrieve theme preference from SecureStore
   * 
   * **Validates: Requirements 7.2, 16.1, 16.4**
   * 
   * @returns Promise resolving to valid theme preference or null if:
   *   - SecureStore is unavailable
   *   - No value is stored
   *   - Stored value is invalid/corrupted
   */
  async get(): Promise<ThemePreference | null> {
    try {
      const value = await SecureStore.getItemAsync(this.key);
      
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
      // SecureStore unavailable (permissions, device restrictions, etc.)
      console.error("Failed to read theme preference from SecureStore:", error);
      return null;
    }
  }
  
  /**
   * Store theme preference to SecureStore
   * 
   * **Validates: Requirements 7.2, 16.1, 16.4**
   * 
   * @param preference - The theme preference to store
   * @returns Promise that resolves when storage is complete
   * 
   * Fails silently if:
   * - SecureStore is unavailable
   * - Storage quota is exceeded
   * - Security restrictions prevent access
   * - Device doesn't support SecureStore
   */
  async set(preference: ThemePreference): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.key, preference);
    } catch (error) {
      // Storage failed - log error but don't break the application
      // Theme will still work, just won't persist across sessions
      console.error("Failed to save theme preference to SecureStore:", error);
    }
  }
  
  /**
   * Remove theme preference from SecureStore
   * 
   * **Validates: Requirements 16.1, 16.4**
   * 
   * @returns Promise that resolves when removal is complete
   * 
   * Fails silently if SecureStore is unavailable
   */
  async remove(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.key);
    } catch (error) {
      // Silent fail - removal is not critical
      console.error("Failed to remove theme preference from SecureStore:", error);
    }
  }
}
