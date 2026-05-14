/**
 * Unit tests for theme storage abstraction
 * 
 * **Validates: Requirements 1.1, 1.2, 16.1, 16.4**
 */

import { LocalStorageThemeStorage } from "../storage";
import type { ThemePreference } from "../types";

describe("LocalStorageThemeStorage", () => {
  let storage: LocalStorageThemeStorage;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    
    global.localStorage = {
      getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: jest.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: jest.fn(),
    } as Storage;

    storage = new LocalStorageThemeStorage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("get()", () => {
    it("should return null when no value is stored", () => {
      expect(storage.get()).toBeNull();
    });

    it("should return stored valid theme preference", () => {
      const validPreferences: ThemePreference[] = ["light", "dark", "system"];
      
      validPreferences.forEach((preference) => {
        mockLocalStorage["ms-otoservis-theme"] = preference;
        expect(storage.get()).toBe(preference);
      });
    });

    it("should return null for invalid stored values", () => {
      const invalidValues = ["invalid", "LIGHT", "Dark", "auto", ""];
      
      invalidValues.forEach((value) => {
        mockLocalStorage["ms-otoservis-theme"] = value;
        expect(storage.get()).toBeNull();
      });
    });

    it("should handle localStorage unavailability gracefully", () => {
      // Mock localStorage.getItem to throw error
      (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error("localStorage is not available");
      });

      expect(storage.get()).toBeNull();
    });

    it("should log warning for invalid stored values", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      
      mockLocalStorage["ms-otoservis-theme"] = "invalid";
      storage.get();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid theme preference in storage")
      );
      
      consoleWarnSpy.mockRestore();
    });

    it("should log error when localStorage throws", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      
      (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error("localStorage is not available");
      });
      
      storage.get();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read theme preference"),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe("set()", () => {
    it("should store valid theme preferences", () => {
      const validPreferences: ThemePreference[] = ["light", "dark", "system"];
      
      validPreferences.forEach((preference) => {
        storage.set(preference);
        expect(mockLocalStorage["ms-otoservis-theme"]).toBe(preference);
      });
    });

    it("should handle localStorage unavailability gracefully", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      
      (global.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      // Should not throw
      expect(() => storage.set("dark")).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to save theme preference"),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe("remove()", () => {
    it("should remove stored theme preference", () => {
      mockLocalStorage["ms-otoservis-theme"] = "dark";
      
      storage.remove();
      
      expect(mockLocalStorage["ms-otoservis-theme"]).toBeUndefined();
    });

    it("should handle localStorage unavailability gracefully", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      
      (global.localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error("localStorage is not available");
      });

      // Should not throw
      expect(() => storage.remove()).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to remove theme preference"),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe("ThemeStorage interface compliance", () => {
    it("should implement all required methods", () => {
      expect(typeof storage.get).toBe("function");
      expect(typeof storage.set).toBe("function");
      expect(typeof storage.remove).toBe("function");
    });
  });
});
