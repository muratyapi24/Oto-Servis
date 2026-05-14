"use client";

/**
 * Theme Provider Component
 * 
 * Provides theme context to the entire application with support for:
 * - User preference persistence (localStorage)
 * - System preference detection and subscription
 * - DOM class application for Tailwind dark mode
 * - SSR-safe initialization
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { ThemeContextValue, ThemeMode, ThemePreference } from "@/lib/theme/types";
import { LocalStorageThemeStorage } from "@/lib/theme/storage";
import { getSystemPreference, subscribeToSystemPreference } from "@/lib/theme/system-preference";
import { resolveTheme } from "@/lib/theme/resolver";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider Component
 * 
 * Manages theme state and provides it to all child components via React Context.
 * Handles storage initialization, system preference subscription, and DOM updates.
 * 
 * @param children - React children to wrap with theme context
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storage = useMemo(() => new LocalStorageThemeStorage(), []);
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemPreference, setSystemPreference] = useState<ThemeMode>("light");
  const [isLoading, setIsLoading] = useState(true);
  
  // Resolve the active theme from preference and system preference
  const theme = resolveTheme(preference, systemPreference);
  
  /**
   * Initialize theme from storage
   * 
   * **Validates: Requirements 4.1, 4.2, 4.3**
   * 
   * Runs once on mount to:
   * 1. Get the current system preference
   * 2. Load stored user preference from localStorage
   * 3. Set initial state
   * 4. Mark loading as complete
   */
  useEffect(() => {
    const storedPreference = storage.get();
    const initialSystemPreference = getSystemPreference();
    
    setSystemPreference(initialSystemPreference);
    
    if (storedPreference) {
      setPreferenceState(storedPreference);
    }
    
    setIsLoading(false);
  }, [storage]);
  
  /**
   * Subscribe to system preference changes
   * 
   * **Validates: Requirements 4.2**
   * 
   * Listens for changes to the OS color scheme preference and updates
   * the system preference state accordingly. The subscription is cleaned
   * up when the component unmounts.
   */
  useEffect(() => {
    const unsubscribe = subscribeToSystemPreference((newSystemPreference) => {
      setSystemPreference(newSystemPreference);
    });
    
    return unsubscribe;
  }, []);
  
  /**
   * Apply theme to DOM
   * 
   * **Validates: Requirements 4.5**
   * 
   * Updates the HTML root element's class list to apply the theme.
   * Adds "dark" class for dark mode, removes it for light mode.
   * This triggers Tailwind's dark mode variants.
   */
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);
  
  /**
   * Update user preference
   * 
   * **Validates: Requirements 4.3, 4.4**
   * 
   * Updates the user's theme preference and persists it to localStorage.
   * The new preference is immediately stored and the state is updated,
   * triggering a re-render with the new theme.
   * 
   * @param newPreference - The new theme preference to set
   */
  const setPreference = useCallback((newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    storage.set(newPreference);
  }, [storage]);
  
  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * 
 * **Validates: Requirements 4.6**
 * 
 * Provides access to the current theme state and preference setter.
 * Must be used within a ThemeProvider component.
 * 
 * @returns Theme context value with theme, preference, setPreference, and isLoading
 * @throws Error if used outside of ThemeProvider
 * 
 * @example
 * function MyComponent() {
 *   const { theme, preference, setPreference } = useTheme();
 *   return <button onClick={() => setPreference("dark")}>Dark Mode</button>;
 * }
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
