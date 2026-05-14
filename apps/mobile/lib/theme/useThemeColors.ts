/**
 * Custom hook for accessing theme-aware colors
 * 
 * This hook combines the useTheme hook with the getThemeColors function
 * to provide easy access to theme-aware colors in components.
 * 
 * **Validates: Requirements 7.6**
 */

import { useTheme } from "@/components/theme-provider";
import { getThemeColors, type ThemeColors } from "./colors";

/**
 * Hook to get theme-aware colors
 * 
 * **Validates: Requirements 7.6**
 * 
 * @returns Theme-specific color palette
 * 
 * @example
 * function MyComponent() {
 *   const colors = useThemeColors();
 *   
 *   return (
 *     <View style={{ backgroundColor: colors.surface }}>
 *       <Text style={{ color: colors.onSurface }}>Hello</Text>
 *     </View>
 *   );
 * }
 */
export function useThemeColors(): ThemeColors {
  const { theme } = useTheme();
  return getThemeColors(theme);
}
