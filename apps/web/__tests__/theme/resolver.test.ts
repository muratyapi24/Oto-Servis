/**
 * Unit tests for theme resolver
 * 
 * Tests the theme resolution logic and preference validation
 */

import { resolveTheme, validateThemePreference } from "@/lib/theme/resolver";
import type { ThemeMode, ThemePreference } from "@/lib/theme/types";

describe("resolveTheme", () => {
  describe("system preference resolution", () => {
    it("should return system preference when user preference is 'system' and system is dark", () => {
      const result = resolveTheme("system", "dark");
      expect(result).toBe("dark");
    });

    it("should return system preference when user preference is 'system' and system is light", () => {
      const result = resolveTheme("system", "light");
      expect(result).toBe("light");
    });
  });

  describe("explicit preference override", () => {
    it("should return 'light' when user preference is 'light' regardless of system preference", () => {
      expect(resolveTheme("light", "dark")).toBe("light");
      expect(resolveTheme("light", "light")).toBe("light");
    });

    it("should return 'dark' when user preference is 'dark' regardless of system preference", () => {
      expect(resolveTheme("dark", "light")).toBe("dark");
      expect(resolveTheme("dark", "dark")).toBe("dark");
    });
  });

  describe("all preference and system combinations", () => {
    const preferences: ThemePreference[] = ["system", "light", "dark"];
    const systemPreferences: ThemeMode[] = ["light", "dark"];

    preferences.forEach((preference) => {
      systemPreferences.forEach((systemPreference) => {
        it(`should correctly resolve preference='${preference}' with system='${systemPreference}'`, () => {
          const result = resolveTheme(preference, systemPreference);
          
          if (preference === "system") {
            expect(result).toBe(systemPreference);
          } else {
            expect(result).toBe(preference);
          }
        });
      });
    });
  });
});

describe("validateThemePreference", () => {
  describe("valid preferences", () => {
    it("should return 'light' for valid 'light' string", () => {
      expect(validateThemePreference("light")).toBe("light");
    });

    it("should return 'dark' for valid 'dark' string", () => {
      expect(validateThemePreference("dark")).toBe("dark");
    });

    it("should return 'system' for valid 'system' string", () => {
      expect(validateThemePreference("system")).toBe("system");
    });
  });

  describe("invalid preferences", () => {
    it("should return null for invalid string values", () => {
      expect(validateThemePreference("invalid")).toBeNull();
      expect(validateThemePreference("")).toBeNull();
      expect(validateThemePreference("DARK")).toBeNull();
      expect(validateThemePreference("Light")).toBeNull();
      expect(validateThemePreference("auto")).toBeNull();
    });

    it("should return null for non-string values", () => {
      expect(validateThemePreference(123)).toBeNull();
      expect(validateThemePreference(true)).toBeNull();
      expect(validateThemePreference(false)).toBeNull();
      expect(validateThemePreference(null)).toBeNull();
      expect(validateThemePreference(undefined)).toBeNull();
      expect(validateThemePreference({})).toBeNull();
      expect(validateThemePreference([])).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle corrupted storage values gracefully", () => {
      // Simulating corrupted localStorage values
      expect(validateThemePreference("light\0")).toBeNull();
      expect(validateThemePreference("dark ")).toBeNull();
      expect(validateThemePreference(" system")).toBeNull();
    });

    it("should be case-sensitive", () => {
      expect(validateThemePreference("LIGHT")).toBeNull();
      expect(validateThemePreference("Dark")).toBeNull();
      expect(validateThemePreference("SYSTEM")).toBeNull();
    });
  });
});
