/**
 * Unit tests for SecureStoreThemeStorage
 * 
 * **Validates: Requirements 7.2, 16.1, 16.4, 17.1**
 */

import * as SecureStore from "expo-secure-store";
import { SecureStoreThemeStorage } from "./storage";
import { THEME_STORAGE_KEY, type ThemePreference } from "./types";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("SecureStoreThemeStorage", () => {
  let storage: SecureStoreThemeStorage;

  beforeEach(() => {
    storage = new SecureStoreThemeStorage();
    jest.clearAllMocks();
  });

  describe("get()", () => {
    it("should return stored theme preference when valid", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("dark");

      const result = await storage.get();

      expect(result).toBe("dark");
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    });

    it("should return null when no value is stored", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await storage.get();

      expect(result).toBeNull();
    });

    it("should return null when stored value is invalid", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("invalid-theme");

      const result = await storage.get();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid theme preference in storage")
      );

      consoleWarnSpy.mockRestore();
    });

    it("should return null and log error when SecureStore fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("SecureStore unavailable");
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(error);

      const result = await storage.get();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to read theme preference from SecureStore:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should validate all valid theme preferences", async () => {
      const validPreferences: ThemePreference[] = ["light", "dark", "system"];

      for (const preference of validPreferences) {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(preference);

        const result = await storage.get();

        expect(result).toBe(preference);
      }
    });
  });

  describe("set()", () => {
    it("should store theme preference", async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await storage.set("dark");

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        THEME_STORAGE_KEY,
        "dark"
      );
    });

    it("should not throw when SecureStore fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Storage quota exceeded");
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(error);

      await expect(storage.set("light")).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save theme preference to SecureStore:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should store all valid theme preferences", async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
      const validPreferences: ThemePreference[] = ["light", "dark", "system"];

      for (const preference of validPreferences) {
        await storage.set(preference);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          THEME_STORAGE_KEY,
          preference
        );
      }
    });
  });

  describe("remove()", () => {
    it("should remove stored theme preference", async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await storage.remove();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    });

    it("should not throw when SecureStore fails", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("SecureStore unavailable");
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(error);

      await expect(storage.remove()).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to remove theme preference from SecureStore:",
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Error Handling (Requirement 16.1, 16.4)", () => {
    it("should handle SecureStore unavailability gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error("SecureStore not available")
      );
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error("SecureStore not available")
      );

      // Get should return null (allowing fallback to system preference)
      const getResult = await storage.get();
      expect(getResult).toBeNull();

      // Set should not throw (theme still works, just not persisted)
      await expect(storage.set("dark")).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });

    it("should validate stored values to handle corruption", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const corruptedValues = [
        "invalid",
        "DARK",
        "Light",
        "auto",
        "123",
        "",
        "null",
        "undefined",
      ];

      for (const corruptedValue of corruptedValues) {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(corruptedValue);

        const result = await storage.get();

        expect(result).toBeNull();
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(corruptedValues.length);

      consoleWarnSpy.mockRestore();
    });
  });
});
