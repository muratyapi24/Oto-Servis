/**
 * Unit tests for system preference detection utilities
 * 
 * Tests the getSystemPreference() and subscribeToSystemPreference() functions
 * to ensure they correctly detect and respond to system color scheme changes.
 * 
 * @jest-environment jsdom
 */

import { getSystemPreference, subscribeToSystemPreference } from "../system-preference";

describe("system-preference", () => {
  describe("getSystemPreference", () => {
    it("should return 'light' or 'dark' based on system preference", () => {
      const preference = getSystemPreference();
      expect(["light", "dark"]).toContain(preference);
    });

    it("should return 'dark' when prefers-color-scheme: dark matches", () => {
      // Mock matchMedia to return dark mode
      const mockMatchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const preference = getSystemPreference();
      expect(preference).toBe("dark");
      expect(mockMatchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("should return 'light' when prefers-color-scheme: dark does not match", () => {
      // Mock matchMedia to return light mode
      const mockMatchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const preference = getSystemPreference();
      expect(preference).toBe("light");
    });

    it("should return 'light' when matchMedia is not supported", () => {
      // Mock unsupported browser
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: undefined,
      });

      const preference = getSystemPreference();
      expect(preference).toBe("light");
    });

    it("should return 'light' and log warning when matchMedia throws error", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      
      // Mock matchMedia to throw error
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation(() => {
          throw new Error("matchMedia error");
        }),
      });

      const preference = getSystemPreference();
      expect(preference).toBe("light");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to detect system preference:",
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("subscribeToSystemPreference", () => {
    it("should call callback when system preference changes", () => {
      const callback = jest.fn();
      let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

      // Mock matchMedia with event listener support
      const mockMatchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        addEventListener: jest.fn((event, handler) => {
          if (event === "change") {
            changeHandler = handler;
          }
        }),
        removeEventListener: jest.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const unsubscribe = subscribeToSystemPreference(callback);

      // Simulate system preference change to dark
      if (changeHandler) {
        (changeHandler as (event: MediaQueryListEvent) => void)({ matches: true } as MediaQueryListEvent);
      }

      expect(callback).toHaveBeenCalledWith("dark");

      // Simulate system preference change to light
      if (changeHandler) {
        (changeHandler as (event: MediaQueryListEvent) => void)({ matches: false } as MediaQueryListEvent);
      }

      expect(callback).toHaveBeenCalledWith("light");
      expect(callback).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it("should return cleanup function that removes event listener", () => {
      const callback = jest.fn();
      const removeEventListenerMock = jest.fn();

      // Mock matchMedia
      const mockMatchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        addEventListener: jest.fn(),
        removeEventListener: removeEventListenerMock,
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const unsubscribe = subscribeToSystemPreference(callback);
      unsubscribe();

      expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("should return no-op cleanup when matchMedia is not supported", () => {
      const callback = jest.fn();

      // Mock unsupported browser
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: undefined,
      });

      const unsubscribe = subscribeToSystemPreference(callback);
      
      // Should not throw when calling cleanup
      expect(() => unsubscribe()).not.toThrow();
    });

    it("should handle errors during subscription setup gracefully", () => {
      const callback = jest.fn();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Mock matchMedia to throw error
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation(() => {
          throw new Error("matchMedia error");
        }),
      });

      const unsubscribe = subscribeToSystemPreference(callback);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to subscribe to system preference changes:",
        expect.any(Error)
      );
      
      // Should return no-op cleanup
      expect(() => unsubscribe()).not.toThrow();

      consoleWarnSpy.mockRestore();
    });

    it("should handle errors during cleanup gracefully", () => {
      const callback = jest.fn();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Mock matchMedia with removeEventListener that throws
      const mockMatchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(() => {
          throw new Error("removeEventListener error");
        }),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const unsubscribe = subscribeToSystemPreference(callback);
      
      // Should not throw when cleanup fails
      expect(() => unsubscribe()).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to remove system preference listener:",
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
