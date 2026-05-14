/**
 * Unit tests for theme-aware style utilities
 * 
 * **Validates: Requirements 7.6**
 */

import { getThemeColors, getTheme, getThemedShadow } from './styles';
import type { ThemeMode } from './types';

describe('Theme Style Utilities', () => {
  describe('getThemeColors', () => {
    it('should return light colors for light mode', () => {
      const colors = getThemeColors('light');
      
      expect(colors.background).toBe('#f7f9fb');
      expect(colors.text).toBe('#191c1e');
      expect(colors.primary).toBe('#00236f');
    });
    
    it('should return dark colors for dark mode', () => {
      const colors = getThemeColors('dark');
      
      expect(colors.background).toBe('#0f1419');
      expect(colors.text).toBe('#e3e5e8');
      expect(colors.primary).toBe('#a8c7fa');
    });
    
    it('should have all required color properties', () => {
      const lightColors = getThemeColors('light');
      const darkColors = getThemeColors('dark');
      
      const requiredProps = [
        'background',
        'surface',
        'surfaceContainerLowest',
        'surfaceContainerLow',
        'surfaceContainer',
        'surfaceContainerHigh',
        'text',
        'textSecondary',
        'textTertiary',
        'primary',
        'primaryContainer',
        'secondary',
        'secondaryContainer',
        'error',
        'success',
        'warning',
        'info',
        'border',
        'outline',
        'outlineVariant',
        'shadow',
      ];
      
      requiredProps.forEach((prop) => {
        expect(lightColors).toHaveProperty(prop);
        expect(darkColors).toHaveProperty(prop);
        expect(typeof lightColors[prop as keyof typeof lightColors]).toBe('string');
        expect(typeof darkColors[prop as keyof typeof darkColors]).toBe('string');
      });
    });
  });
  
  describe('getTheme', () => {
    it('should return theme object with mode and colors for light mode', () => {
      const theme = getTheme('light');
      
      expect(theme.mode).toBe('light');
      expect(theme.colors).toBeDefined();
      expect(theme.colors.background).toBe('#f7f9fb');
    });
    
    it('should return theme object with mode and colors for dark mode', () => {
      const theme = getTheme('dark');
      
      expect(theme.mode).toBe('dark');
      expect(theme.colors).toBeDefined();
      expect(theme.colors.background).toBe('#0f1419');
    });
  });
  
  describe('getThemedShadow', () => {
    it('should return small shadow for light mode', () => {
      const shadow = getThemedShadow('sm', 'light');
      
      expect(shadow.shadowColor).toBe('rgba(0, 35, 111, 1)');
      expect(shadow.shadowOffset).toEqual({ width: 0, height: 4 });
      expect(shadow.shadowOpacity).toBe(0.04);
      expect(shadow.shadowRadius).toBe(10);
      expect(shadow.elevation).toBe(2);
    });
    
    it('should return small shadow for dark mode with adjusted opacity', () => {
      const shadow = getThemedShadow('sm', 'dark');
      
      expect(shadow.shadowColor).toBe('rgba(0, 0, 0, 0.8)');
      expect(shadow.shadowOffset).toEqual({ width: 0, height: 4 });
      expect(shadow.shadowOpacity).toBe(0.3);
      expect(shadow.shadowRadius).toBe(10);
      expect(shadow.elevation).toBe(2);
    });
    
    it('should return medium shadow for light mode', () => {
      const shadow = getThemedShadow('md', 'light');
      
      expect(shadow.shadowColor).toBe('rgba(0, 35, 111, 1)');
      expect(shadow.shadowOffset).toEqual({ width: 0, height: 10 });
      expect(shadow.shadowOpacity).toBe(0.05);
      expect(shadow.shadowRadius).toBe(25);
      expect(shadow.elevation).toBe(4);
    });
    
    it('should return medium shadow for dark mode with adjusted opacity', () => {
      const shadow = getThemedShadow('md', 'dark');
      
      expect(shadow.shadowColor).toBe('rgba(0, 0, 0, 0.8)');
      expect(shadow.shadowOffset).toEqual({ width: 0, height: 10 });
      expect(shadow.shadowOpacity).toBe(0.4);
      expect(shadow.shadowRadius).toBe(25);
      expect(shadow.elevation).toBe(4);
    });
  });
  
  describe('Theme consistency', () => {
    it('should have consistent color structure between light and dark themes', () => {
      const lightColors = getThemeColors('light');
      const darkColors = getThemeColors('dark');
      
      const lightKeys = Object.keys(lightColors).sort();
      const darkKeys = Object.keys(darkColors).sort();
      
      expect(lightKeys).toEqual(darkKeys);
    });
    
    it('should have different color values between light and dark themes', () => {
      const lightColors = getThemeColors('light');
      const darkColors = getThemeColors('dark');
      
      // Background colors should be different
      expect(lightColors.background).not.toBe(darkColors.background);
      expect(lightColors.text).not.toBe(darkColors.text);
      expect(lightColors.primary).not.toBe(darkColors.primary);
    });
  });
  
  describe('Color format validation', () => {
    it('should have valid hex color format for all colors', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$|^rgba?\([^)]+\)$/;
      const lightColors = getThemeColors('light');
      const darkColors = getThemeColors('dark');
      
      Object.values(lightColors).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
      
      Object.values(darkColors).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });
});

describe('Theme Utilities Integration', () => {
  it('should provide all necessary utilities for theme-aware styling', () => {
    // This test verifies that all the key utilities are exported
    const theme = getTheme('light');
    const colors = getThemeColors('light');
    const shadow = getThemedShadow('sm', 'light');
    
    expect(theme).toBeDefined();
    expect(colors).toBeDefined();
    expect(shadow).toBeDefined();
  });
  
  it('should support both theme modes', () => {
    const modes: ThemeMode[] = ['light', 'dark'];
    
    modes.forEach((mode) => {
      const theme = getTheme(mode);
      expect(theme.mode).toBe(mode);
      expect(theme.colors).toBeDefined();
    });
  });
});
