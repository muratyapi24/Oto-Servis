# Mobile Theme Update Guide

## Task 13.3: Update Mobile Screen Styles

This document provides guidance for updating all mobile screens to support dark/light theme switching.

## Overview

All mobile screens in `apps/mobile/app/` need to be updated to use theme-aware styles instead of hardcoded `Colors` constants. This enables proper dark mode support across the entire mobile application.

## Pattern to Follow

### Before (Hardcoded Colors)

```typescript
import { Colors } from "@/constants/theme";

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,  // ❌ Hardcoded
    padding: 16,
  },
  title: {
    color: Colors.onSurface,  // ❌ Hardcoded
    fontSize: 18,
  },
});
```

### After (Theme-Aware)

```typescript
import { useThemeColors } from "@/lib/theme/useThemeColors";

export default function MyScreen() {
  const colors = useThemeColors();  // ✅ Get theme colors
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.onSurface }]}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor removed from StyleSheet
    padding: 16,
  },
  title: {
    // color removed from StyleSheet
    fontSize: 18,
  },
});
```

## Step-by-Step Update Process

### 1. Add Import

Add the `useThemeColors` import at the top of the file:

```typescript
import { useThemeColors } from "@/lib/theme/useThemeColors";
```

### 2. Add Hook in Component

At the start of your component function, add:

```typescript
const colors = useThemeColors();
```

### 3. Remove Colors from StyleSheet

Remove all color properties from `StyleSheet.create()`:
- `backgroundColor`
- `color`
- `borderColor`
- Any property that references `Colors.*`

Keep layout and sizing properties:
- `padding`, `margin`, `width`, `height`
- `fontSize`, `fontWeight`
- `borderRadius`, `borderWidth`
- `flexDirection`, `alignItems`, etc.

### 4. Apply Colors Dynamically in JSX

Apply colors using inline styles in your JSX:

```typescript
<View style={[styles.container, { backgroundColor: colors.surface }]}>
  <Text style={[styles.text, { color: colors.onSurface }]}>Content</Text>
</View>
```

## Color Mappings

| Old (Colors.*) | New (colors.*) |
|----------------|----------------|
| `Colors.surface` | `colors.surface` |
| `Colors.onSurface` | `colors.onSurface` |
| `Colors.primary` | `colors.primary` |
| `Colors.primaryContainer` | `colors.primaryContainer` |
| `Colors.secondary` | `colors.secondary` |
| `Colors.secondaryContainer` | `colors.secondaryContainer` |
| `Colors.error` | `colors.error` |
| `Colors.outline` | `colors.outline` |
| `Colors.outlineVariant` | `colors.outlineVariant` |
| `Colors.surfaceContainerLowest` | `colors.surfaceContainerLowest` |
| `Colors.surfaceContainerLow` | `colors.surfaceContainerLow` |
| `Colors.surfaceContainer` | `colors.surfaceContainer` |
| `Colors.surfaceContainerHigh` | `colors.surfaceContainerHigh` |

## Complete Example

See `apps/mobile/app/(musteri)/panel.tsx` and `apps/mobile/app/(firma)/panel.tsx` for complete working examples.

## Files to Update

### Priority 1 - Main Screens (✅ Completed)
- [x] `apps/mobile/app/(musteri)/panel.tsx`
- [x] `apps/mobile/app/(firma)/panel.tsx`

### Priority 2 - Auth & Settings
- [ ] `apps/mobile/app/(musteri)/login.tsx`
- [ ] `apps/mobile/app/(musteri)/profil.tsx`
- [ ] `apps/mobile/app/(firma)/login.tsx`
- [ ] `apps/mobile/app/(firma)/ayarlar.tsx`

### Priority 3 - Common Screens
- [ ] `apps/mobile/app/(musteri)/gecmis.tsx`
- [ ] `apps/mobile/app/(musteri)/takip.tsx`
- [ ] `apps/mobile/app/(musteri)/bildirimler.tsx`
- [ ] `apps/mobile/app/(musteri)/mesajlar.tsx`
- [ ] `apps/mobile/app/(firma)/kuyruk.tsx`
- [ ] `apps/mobile/app/(firma)/bildirimler.tsx`
- [ ] `apps/mobile/app/(firma)/mesajlar.tsx`

### Priority 4 - Feature Screens
All remaining screens in:
- `apps/mobile/app/(musteri)/*.tsx`
- `apps/mobile/app/(firma)/*.tsx`
- `apps/mobile/app/(musteri)/*/*.tsx`
- `apps/mobile/app/(firma)/*/*.tsx`

## Testing

After updating each screen:

1. **Visual Test**: Open the screen in both light and dark modes
2. **Check Contrast**: Ensure text is readable in both themes
3. **Check Backgrounds**: Ensure all backgrounds adapt to theme
4. **Check Borders**: Ensure borders are visible in both themes

## Common Pitfalls

### ❌ Don't: Keep colors in StyleSheet

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,  // ❌ Won't work - colors not available here
  },
});
```

### ✅ Do: Apply colors in JSX

```typescript
<View style={[styles.container, { backgroundColor: colors.surface }]}>
```

### ❌ Don't: Forget to remove old Colors import

```typescript
import { Colors } from "@/constants/theme";  // ❌ Remove this
```

### ✅ Do: Use useThemeColors hook

```typescript
import { useThemeColors } from "@/lib/theme/useThemeColors";  // ✅ Use this
```

## Automation Script

A helper script is available at `update-mobile-theme.mjs` that can:
- Add the `useThemeColors` import
- Add the `const colors = useThemeColors()` hook
- Identify files that need updating

Run with:
```bash
node update-mobile-theme.mjs
```

Note: The script only adds imports and hooks. You still need to manually move colors from StyleSheet to JSX.

## Progress Tracking

Total screens: ~50+
Completed: 2 (panel screens)
Remaining: ~48

## Additional Resources

- Theme utilities documentation: `apps/mobile/lib/theme/EXAMPLES.md`
- Theme colors definition: `apps/mobile/lib/theme/colors.ts`
- Theme provider: `apps/mobile/components/theme-provider.tsx`

