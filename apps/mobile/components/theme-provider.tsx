/**
 * Mobile Theme Provider Component
 * 
 * This component provides theme context to the entire mobile application.
 * It manages theme state, persistence, and system preference synchronization.
 * 
 * **Validates: Requirements 7.1, 7.2, 7.5, 7.6**
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { ThemeContextValue, ThemeMode, ThemePreference } from "@/lib/theme/types";
import { SecureStoreThemeStorage } from "@/lib/theme/storage";
import { getSystemPreference, subscribeToSystemPreference } from "@/lib/theme/system-preference";
import { resolveTheme } from "@/lib/theme/resolver";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const storage = new SecureStoreThemeStorage();

/**
 * Theme Provider Component
 * 
 * Wraps the application and provides theme context to all child components.
 * Handles:
 * - Loading theme preference from SecureStore
 * - Detecting system color scheme preference
 * - Subscribing to system preference changes
 * - Persisting theme preference updates
 * 
 * **Validates: Requirements 7.1, 7.2, 7.5, 7.6**
 * 
 * @param children - React children to wrap with theme context
 * 
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemPreference, setSystemPreference] = useState<ThemeMode>("light");
  const [isLoading, setIsLoading] = useState(true);
  
  const theme = resolveTheme(preference, systemPreference);
  
  // Initialize theme from storage
  // **Validates: Requirements 7.2**
  useEffect(() => {
    (async () => {
      const storedPreference = await storage.get();
      const initialSystemPreference = getSystemPreference();
      
      setSystemPreference(initialSystemPreference);
      
      if (storedPreference) {
        setPreferenceState(storedPreference);
      }
      
      setIsLoading(false);
    })();
  }, []);
  
  // Subscribe to system preference changes
  // **Validates: Requirements 7.5**
  useEffect(() => {
    const unsubscribe = subscribeToSystemPreference((newSystemPreference) => {
      setSystemPreference(newSystemPreference);
    });
    
    return unsubscribe;
  }, []);
  
  // Update preference and persist to storage
  // **Validates: Requirements 7.2**
  const setPreference = useCallback((newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    storage.set(newPreference);
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * 
 * Must be used within a ThemeProvider component.
 * Provides access to current theme, preference, and setPreference function.
 * 
 * **Validates: Requirements 7.1, 7.6**
 * 
 * @returns Theme context value
 * @throws Error if used outside ThemeProvider
 * 
 * @example
 * function MyComponent() {
 *   const { theme, preference, setPreference } = useTheme();
 *   
 *   return (
 *     <View style={{ backgroundColor: theme === "dark" ? "#000" : "#fff" }}>
 *       <Text>Current theme: {theme}</Text>
 *     </View>
 *   );
 * }
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
