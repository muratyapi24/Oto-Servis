# Theme-Aware Style Utilities for Mobile

This directory contains comprehensive theme-aware style utilities for React Native components in the MS Oto Servis mobile app.

## Overview

The theme system provides multiple approaches for creating theme-aware styles:

1. **`useThemedStyles()`** - Primary hook for creating theme-aware styles (recommended)
2. **`useThemeColors()`** - Get theme-aware color palette
3. **`useThemeObject()`** - Get complete theme object with mode and colors
4. **`useConditionalStyle()`** - Simple conditional styling for light/dark modes
5. **`useThemedShadow()`** - Theme-aware shadow styles

## Quick Start

### Basic Usage with `useThemedStyles()`

This is the recommended approach for most components:

```typescript
import { useThemedStyles, createThemedStyles } from '@/lib/theme/styles';

function MyComponent() {
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
    </View>
  );
}

const createStyles = createThemedStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
}));
```

### Using `useThemeColors()`

For simpler cases where you only need colors:

```typescript
import { useThemeColors } from '@/lib/theme/styles';

function MyComponent() {
  const colors = useThemeColors();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

### Using `useConditionalStyle()`

For simple conditional styling without creating a full style creator:

```typescript
import { useConditionalStyle } from '@/lib/theme/styles';

function MyComponent() {
  const containerStyle = useConditionalStyle(
    { backgroundColor: '#fff' }, // Light mode
    { backgroundColor: '#000' }  // Dark mode
  );
  
  return <View style={containerStyle} />;
}
```

### Using `useThemedShadow()`

For theme-aware shadows:

```typescript
import { useThemedShadow } from '@/lib/theme/styles';

function MyCard() {
  const shadow = useThemedShadow('md'); // 'sm' or 'md'
  
  return (
    <View style={[styles.card, shadow]}>
      <Text>Card content</Text>
    </View>
  );
}
```

## Available Theme Colors

The theme system provides the following color tokens:

### Surface Colors
- `background` - Main background color
- `surface` - Surface/card background
- `surfaceContainerLowest` - Lowest elevation surface
- `surfaceContainerLow` - Low elevation surface
- `surfaceContainer` - Standard elevation surface
- `surfaceContainerHigh` - High elevation surface

### Text Colors
- `text` - Primary text color
- `textSecondary` - Secondary text color
- `textTertiary` - Tertiary/muted text color

### Brand Colors
- `primary` - Primary brand color
- `primaryContainer` - Primary container/background
- `secondary` - Secondary brand color
- `secondaryContainer` - Secondary container/background

### Semantic Colors
- `error` - Error/danger color
- `success` - Success color
- `warning` - Warning color
- `info` - Info color

### Border Colors
- `border` - Standard border color
- `outline` - Outline color
- `outlineVariant` - Variant outline color

### Other
- `shadow` - Shadow color

## Migration Guide

If you have existing components using the old `Colors` and `DarkColors` constants, here's how to migrate:

### Before (Old Approach)

```typescript
import { Colors, DarkColors } from '../constants/theme';
import { useTheme } from './theme-provider';

function MyComponent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = isDark ? DarkColors : Colors;
  
  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.onSurface }}>Hello</Text>
    </View>
  );
}
```

### After (New Approach)

```typescript
import { useThemedStyles, createThemedStyles } from '@/lib/theme/styles';

function MyComponent() {
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello</Text>
    </View>
  );
}

const createStyles = createThemedStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
  },
  text: {
    color: theme.colors.text,
  },
}));
```

## Performance Considerations

- All hooks use `useMemo` internally to prevent unnecessary recalculations
- Style creators are only called when the theme changes
- Use `createThemedStyles()` wrapper for better type safety

## Type Safety

All utilities are fully typed with TypeScript:

```typescript
import type { Theme, ThemeColors } from '@/lib/theme/styles';

// Theme object includes:
interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}
```

## Requirements Validation

**Validates: Requirements 7.6**

These utilities fulfill the requirement: "THE Mobile_App SHALL apply theme changes to all React Native components using the theme context"

## Files

- `types.ts` - Theme type definitions and constants
- `colors.ts` - Legacy color system (deprecated, use `styles.ts` instead)
- `styles.ts` - **Main theme utilities (use this)**
- `storage.ts` - Theme preference storage (SecureStore)
- `system-preference.ts` - System theme detection
- `resolver.ts` - Theme resolution logic
- `useThemeColors.ts` - Legacy hook (deprecated, use `styles.ts` instead)

## Examples

See the component examples in `apps/mobile/components/` for real-world usage patterns.
