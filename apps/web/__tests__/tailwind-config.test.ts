import { describe, it, expect } from '@jest/globals';
import config from '../tailwind.config';

describe('Tailwind Configuration', () => {
  it('should have darkMode set to class strategy', () => {
    expect(config.darkMode).toEqual('class');
  });

  it('should have content paths configured', () => {
    expect(config.content).toBeDefined();
    expect(Array.isArray(config.content)).toBe(true);
    expect(config.content.length).toBeGreaterThan(0);
  });

  it('should extend theme colors with CSS custom properties', () => {
    expect(config.theme?.extend?.colors).toBeDefined();
    
    const colors = config.theme?.extend?.colors as Record<string, string>;
    
    // Check Material Design 3 color tokens are mapped
    expect(colors['primary']).toBe('var(--color-primary)');
    expect(colors['secondary']).toBe('var(--color-secondary)');
    expect(colors['tertiary']).toBe('var(--color-tertiary)');
    expect(colors['error']).toBe('var(--color-error)');
    expect(colors['background']).toBe('var(--color-background)');
    expect(colors['surface']).toBe('var(--color-surface)');
  });

  it('should map surface color variants', () => {
    const colors = config.theme?.extend?.colors as Record<string, string>;
    
    expect(colors['surface-container-lowest']).toBe('var(--color-surface-container-lowest)');
    expect(colors['surface-container-low']).toBe('var(--color-surface-container-low)');
    expect(colors['surface-container']).toBe('var(--color-surface-container)');
    expect(colors['surface-container-high']).toBe('var(--color-surface-container-high)');
    expect(colors['surface-container-highest']).toBe('var(--color-surface-container-highest)');
  });

  it('should map primary color variants', () => {
    const colors = config.theme?.extend?.colors as Record<string, string>;
    
    expect(colors['on-primary']).toBe('var(--color-on-primary)');
    expect(colors['primary-container']).toBe('var(--color-primary-container)');
    expect(colors['on-primary-container']).toBe('var(--color-on-primary-container)');
    expect(colors['primary-fixed']).toBe('var(--color-primary-fixed)');
  });

  it('should map outline colors', () => {
    const colors = config.theme?.extend?.colors as Record<string, string>;
    
    expect(colors['outline']).toBe('var(--color-outline)');
    expect(colors['outline-variant']).toBe('var(--color-outline-variant)');
  });

  it('should extend fontFamily with CSS custom properties', () => {
    expect(config.theme?.extend?.fontFamily).toBeDefined();
    
    const fontFamily = config.theme?.extend?.fontFamily as Record<string, string[]>;
    
    expect(fontFamily['sans']).toEqual(['var(--font-sans)']);
    expect(fontFamily['headline']).toEqual(['var(--font-headline)']);
    expect(fontFamily['body']).toEqual(['var(--font-body)']);
    expect(fontFamily['label']).toEqual(['var(--font-label)']);
  });

  it('should extend boxShadow with CSS custom properties', () => {
    expect(config.theme?.extend?.boxShadow).toBeDefined();
    
    const boxShadow = config.theme?.extend?.boxShadow as Record<string, string>;
    
    expect(boxShadow['xs']).toBe('var(--shadow-xs)');
    expect(boxShadow['sm']).toBe('var(--shadow-sm)');
    expect(boxShadow['md']).toBe('var(--shadow-md)');
    expect(boxShadow['lg']).toBe('var(--shadow-lg)');
    expect(boxShadow['xl']).toBe('var(--shadow-xl)');
  });

  it('should extend borderRadius with CSS custom properties', () => {
    expect(config.theme?.extend?.borderRadius).toBeDefined();
    
    const borderRadius = config.theme?.extend?.borderRadius as Record<string, string>;
    
    expect(borderRadius['sm']).toBe('var(--radius-sm)');
    expect(borderRadius['md']).toBe('var(--radius-md)');
    expect(borderRadius['lg']).toBe('var(--radius-lg)');
    expect(borderRadius['xl']).toBe('var(--radius-xl)');
    expect(borderRadius['2xl']).toBe('var(--radius-2xl)');
    expect(borderRadius['full']).toBe('var(--radius-full)');
  });

  it('should extend animations with CSS custom properties', () => {
    expect(config.theme?.extend?.animation).toBeDefined();
    
    const animation = config.theme?.extend?.animation as Record<string, string>;
    
    expect(animation['fade-in']).toBe('var(--animate-fade-in)');
    expect(animation['slide-up']).toBe('var(--animate-slide-up)');
    expect(animation['slide-down']).toBe('var(--animate-slide-down)');
    expect(animation['scale-in']).toBe('var(--animate-scale-in)');
  });
});
