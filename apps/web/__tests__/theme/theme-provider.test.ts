/**
 * Unit tests for ThemeProvider component
 * 
 * Tests the theme provider's context management, storage integration,
 * and system preference subscription.
 * 
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { LocalStorageThemeStorage } from "@/lib/theme/storage";
import * as systemPreference from "@/lib/theme/system-preference";
import type { ThemeMode } from "@/lib/theme/types";

// Mock the storage module
jest.mock("@/lib/theme/storage");
jest.mock("@/lib/theme/system-preference");

describe("ThemeProvider", () => {
  let mockStorage: jest.Mocked<LocalStorageThemeStorage>;
  let mockGetSystemPreference: jest.MockedFunction<typeof systemPreference.getSystemPreference>;
  let mockSubscribeToSystemPreference: jest.MockedFunction<typeof systemPreference.subscribeToSystemPreference>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock storage instance
    mockStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    } as any;

    // Mock the storage constructor
    (LocalStorageThemeStorage as jest.Mock).mockImplementation(() => mockStorage);

    // Mock system preference functions
    mockGetSystemPreference = systemPreference.getSystemPreference as jest.MockedFunction<typeof systemPreference.getSystemPreference>;
    mockSubscribeToSystemPreference = systemPreference.subscribeToSystemPreference as jest.MockedFunction<typeof systemPreference.subscribeToSystemPreference>;

    // Default mock implementations
    mockGetSystemPreference.mockReturnValue("light");
    mockSubscribeToSystemPreference.mockReturnValue(() => {});
  });

  describe("initialization", () => {
    it("should initialize with system preference when no stored preference exists", async () => {
      mockStorage.get.mockReturnValue(null);
      mockGetSystemPreference.mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preference).toBe("system");
      expect(result.current.theme).toBe("light");
    });

    it("should initialize with stored preference when available", async () => {
      mockStorage.get.mockReturnValue("dark");
      mockGetSystemPreference.mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.preference).toBe("dark");
      expect(result.current.theme).toBe("dark");
    });

    it("should call getSystemPreference on mount", async () => {
      mockStorage.get.mockReturnValue(null);

      renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(mockGetSystemPreference).toHaveBeenCalledTimes(1);
      });
    });

    it("should subscribe to system preference changes on mount", async () => {
      mockStorage.get.mockReturnValue(null);

      renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(mockSubscribeToSystemPreference).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("setPreference", () => {
    it("should update preference state when setPreference is called", async () => {
      mockStorage.get.mockReturnValue(null);
      mockGetSystemPreference.mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPreference("dark");
      });

      expect(result.current.preference).toBe("dark");
      expect(result.current.theme).toBe("dark");
    });

    it("should persist preference to storage when setPreference is called", async () => {
      mockStorage.get.mockReturnValue(null);
      mockGetSystemPreference.mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setPreference("dark");
      });

      expect(mockStorage.set).toHaveBeenCalledWith("dark");
    });

    it("should update theme when preference changes from system to explicit", async () => {
      mockStorage.get.mockReturnValue("system");
      mockGetSystemPreference.mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.theme).toBe("light");

      act(() => {
        result.current.setPreference("dark");
      });

      expect(result.current.theme).toBe("dark");
    });
  });

  describe("system preference changes", () => {
    it("should update theme when system preference changes and user preference is system", async () => {
      mockStorage.get.mockReturnValue("system");
      mockGetSystemPreference.mockReturnValue("light");

      let systemPreferenceCallback: ((theme: ThemeMode) => void) | null = null;
      mockSubscribeToSystemPreference.mockImplementation((callback) => {
        systemPreferenceCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.theme).toBe("light");

      // Simulate system preference change
      act(() => {
        systemPreferenceCallback?.("dark");
      });

      expect(result.current.theme).toBe("dark");
    });

    it("should not update theme when system preference changes and user has explicit preference", async () => {
      mockStorage.get.mockReturnValue("light");
      mockGetSystemPreference.mockReturnValue("light");

      let systemPreferenceCallback: ((theme: ThemeMode) => void) | null = null;
      mockSubscribeToSystemPreference.mockImplementation((callback) => {
        systemPreferenceCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.theme).toBe("light");

      // Simulate system preference change
      act(() => {
        systemPreferenceCallback?.("dark");
      });

      // Theme should remain light because user has explicit preference
      expect(result.current.theme).toBe("light");
    });
  });

  describe("useTheme hook", () => {
    it("should throw error when used outside ThemeProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within ThemeProvider");

      consoleSpy.mockRestore();
    });

    it("should expose theme, preference, setPreference, and isLoading", async () => {
      mockStorage.get.mockReturnValue(null);
      mockGetSystemPreference.mockReturnValue("light");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty("theme");
      expect(result.current).toHaveProperty("preference");
      expect(result.current).toHaveProperty("setPreference");
      expect(result.current).toHaveProperty("isLoading");
      expect(typeof result.current.setPreference).toBe("function");
    });
  });

  describe("cleanup", () => {
    it("should call unsubscribe function on unmount", async () => {
      mockStorage.get.mockReturnValue(null);
      const unsubscribeMock = jest.fn();
      mockSubscribeToSystemPreference.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      await waitFor(() => {
        expect(mockSubscribeToSystemPreference).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });
});
