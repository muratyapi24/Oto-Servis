/**
 * Unit tests for system preference detection
 * 
 * Tests the getSystemPreference() and subscribeToSystemPreference() functions
 * to ensure they correctly interact with React Native's Appearance API.
 */

import { Appearance } from "react-native";
import { getSystemPreference, subscribeToSystemPreference } from "./system-preference";

// Mock React Native's Appearance API
jest.mock("react-native", () => ({
  Appearance: {
    getColorScheme: jest.fn(),
    addChangeListener: jest.fn(),
  },
}));

describe("getSystemPreference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 'dark' when system prefers dark mode", () => {
    (Appearance.getColorScheme as jest.Mock).mockReturnValue("dark");
    
    const result = getSystemPreference();
    
    expect(result).toBe("dark");
    expect(Appearance.getColorScheme).toHaveBeenCalledTimes(1);
  });

  it("should return 'light' when system prefers light mode", () => {
    (Appearance.getColorScheme as jest.Mock).mockReturnValue("light");
    
    const result = getSystemPreference();
    
    expect(result).toBe("light");
    expect(Appearance.getColorScheme).toHaveBeenCalledTimes(1);
  });

  it("should return 'light' when system preference is null", () => {
    (Appearance.getColorScheme as jest.Mock).mockReturnValue(null);
    
    const result = getSystemPreference();
    
    expect(result).toBe("light");
  });

  it("should return 'light' when system preference is undefined", () => {
    (Appearance.getColorScheme as jest.Mock).mockReturnValue(undefined);
    
    const result = getSystemPreference();
    
    expect(result).toBe("light");
  });
});

describe("subscribeToSystemPreference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a listener with Appearance API", () => {
    const mockRemove = jest.fn();
    (Appearance.addChangeListener as jest.Mock).mockReturnValue({ remove: mockRemove });
    
    const callback = jest.fn();
    subscribeToSystemPreference(callback);
    
    expect(Appearance.addChangeListener).toHaveBeenCalledTimes(1);
    expect(Appearance.addChangeListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should call callback with 'dark' when system changes to dark mode", () => {
    let changeHandler: ((event: { colorScheme: "light" | "dark" | null }) => void) | null = null;
    
    (Appearance.addChangeListener as jest.Mock).mockImplementation((handler) => {
      changeHandler = handler;
      return { remove: jest.fn() };
    });
    
    const callback = jest.fn();
    subscribeToSystemPreference(callback);
    
    // Simulate system change to dark mode
    changeHandler?.({ colorScheme: "dark" });
    
    expect(callback).toHaveBeenCalledWith("dark");
  });

  it("should call callback with 'light' when system changes to light mode", () => {
    let changeHandler: ((event: { colorScheme: "light" | "dark" | null }) => void) | null = null;
    
    (Appearance.addChangeListener as jest.Mock).mockImplementation((handler) => {
      changeHandler = handler;
      return { remove: jest.fn() };
    });
    
    const callback = jest.fn();
    subscribeToSystemPreference(callback);
    
    // Simulate system change to light mode
    changeHandler?.({ colorScheme: "light" });
    
    expect(callback).toHaveBeenCalledWith("light");
  });

  it("should call callback with 'light' when system changes to null", () => {
    let changeHandler: ((event: { colorScheme: "light" | "dark" | null }) => void) | null = null;
    
    (Appearance.addChangeListener as jest.Mock).mockImplementation((handler) => {
      changeHandler = handler;
      return { remove: jest.fn() };
    });
    
    const callback = jest.fn();
    subscribeToSystemPreference(callback);
    
    // Simulate system change to null
    changeHandler?.({ colorScheme: null });
    
    expect(callback).toHaveBeenCalledWith("light");
  });

  it("should return a cleanup function that removes the listener", () => {
    const mockRemove = jest.fn();
    (Appearance.addChangeListener as jest.Mock).mockReturnValue({ remove: mockRemove });
    
    const callback = jest.fn();
    const unsubscribe = subscribeToSystemPreference(callback);
    
    expect(typeof unsubscribe).toBe("function");
    
    unsubscribe();
    
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple subscriptions independently", () => {
    const mockRemove1 = jest.fn();
    const mockRemove2 = jest.fn();
    
    (Appearance.addChangeListener as jest.Mock)
      .mockReturnValueOnce({ remove: mockRemove1 })
      .mockReturnValueOnce({ remove: mockRemove2 });
    
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    const unsubscribe1 = subscribeToSystemPreference(callback1);
    const unsubscribe2 = subscribeToSystemPreference(callback2);
    
    expect(Appearance.addChangeListener).toHaveBeenCalledTimes(2);
    
    unsubscribe1();
    expect(mockRemove1).toHaveBeenCalledTimes(1);
    expect(mockRemove2).not.toHaveBeenCalled();
    
    unsubscribe2();
    expect(mockRemove2).toHaveBeenCalledTimes(1);
  });
});
