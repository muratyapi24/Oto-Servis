/**
 * Mobile Theme Toggle Component
 * 
 * This component provides a UI for switching between light, dark, and system themes
 * in the mobile application. It displays three buttons with emoji icons and adapts
 * its styling based on the current theme.
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "./theme-provider";
import type { ThemePreference } from "@/lib/theme/types";

/**
 * Theme option configuration
 * Defines the available theme options with their labels and icons
 */
const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "system", label: "Sistem", icon: "💻" },
  { value: "light", label: "Açık", icon: "☀️" },
  { value: "dark", label: "Koyu", icon: "🌙" },
];

/**
 * Theme Toggle Component
 * 
 * Displays three buttons for theme selection: system, light, and dark.
 * The currently selected theme is highlighted with a different border and background color.
 * All buttons include accessibility labels and states for screen readers.
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 * 
 * @example
 * // In a settings screen
 * <View>
 *   <Text>Tema Ayarları</Text>
 *   <ThemeToggle />
 * </View>
 */
export function ThemeToggle() {
  const { preference, setPreference, theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, theme === "dark" && styles.labelDark]}>
        Tema
      </Text>
      <View style={styles.options}>
        {THEME_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              theme === "dark" && styles.optionDark,
              preference === option.value && styles.optionActive,
              preference === option.value && theme === "dark" && styles.optionActiveDark,
            ]}
            onPress={() => setPreference(option.value)}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} tema`}
            accessibilityState={{ selected: preference === option.value }}
          >
            <Text style={styles.icon}>{option.icon}</Text>
            <Text
              style={[
                styles.optionText,
                theme === "dark" && styles.optionTextDark,
                preference === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/**
 * Styles for the theme toggle component
 * 
 * Includes theme-aware styles for light and dark modes:
 * - Light mode: white backgrounds, dark text, gray borders
 * - Dark mode: dark backgrounds, light text, darker borders
 * - Active state: blue borders and backgrounds
 */
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },
  labelDark: {
    color: "#fff",
  },
  options: {
    flexDirection: "row",
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  optionDark: {
    borderColor: "#374151",
    backgroundColor: "#1f2937",
  },
  optionActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  optionActiveDark: {
    borderColor: "#3b82f6",
    backgroundColor: "#1e3a8a",
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  optionTextDark: {
    color: "#fff",
  },
  optionTextActive: {
    color: "#3b82f6",
  },
});
