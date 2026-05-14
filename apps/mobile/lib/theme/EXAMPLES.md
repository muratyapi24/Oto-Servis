# Theme-Aware Style Utilities - Examples

This document provides practical examples of using the theme-aware style utilities in different scenarios.

## Example 1: Simple Card Component

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemedStyles, createThemedStyles } from '@/lib/theme/styles';

interface CardProps {
  title: string;
  description: string;
  onPress: () => void;
}

export function Card({ title, description, onPress }: CardProps) {
  const styles = useThemedStyles(createStyles);
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const createStyles = createThemedStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
}));
```

## Example 2: Button with Theme-Aware Colors

```typescript
import { TouchableOpacity, Text } from 'react-native';
import { useThemedStyles, createThemedStyles } from '@/lib/theme/styles';

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'error';
  onPress: () => void;
}

export function Button({ label, variant = 'primary', onPress }: ButtonProps) {
  const styles = useThemedStyles((theme) => createStyles(theme, variant));
  
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme, variant: 'primary' | 'secondary' | 'error') => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primary,
          text: '#fff',
        };
      case 'secondary':
        return {
          bg: theme.colors.secondary,
          text: '#fff',
        };
      case 'error':
        return {
          bg: theme.colors.error,
          text: '#fff',
        };
    }
  };
  
  const colors = getColors();
  
  return {
    button: {
      backgroundColor: colors.bg,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600' as const,
    },
  };
};
```

## Example 3: List Item with Conditional Styling

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemedStyles, createThemedStyles, useThemedShadow } from '@/lib/theme/styles';

interface ListItemProps {
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  onPress: () => void;
}

export function ListItem({ title, subtitle, isSelected, onPress }: ListItemProps) {
  const styles = useThemedStyles((theme) => createStyles(theme, isSelected));
  const shadow = useThemedShadow('sm');
  
  return (
    <TouchableOpacity 
      style={[styles.container, isSelected && shadow]} 
      onPress={onPress}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme, isSelected?: boolean) => ({
  container: {
    backgroundColor: isSelected 
      ? theme.colors.primaryContainer 
      : theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: isSelected ? 2 : 1,
    borderColor: isSelected 
      ? theme.colors.primary 
      : theme.colors.border,
  },
  title: {
    color: isSelected 
      ? '#fff' 
      : theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: isSelected 
      ? 'rgba(255, 255, 255, 0.8)' 
      : theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
```

## Example 4: Using `useThemeColors()` for Simple Cases

```typescript
import { View, Text } from 'react-native';
import { useThemeColors } from '@/lib/theme/styles';

export function SimpleHeader({ title }: { title: string }) {
  const colors = useThemeColors();
  
  return (
    <View style={{ 
      backgroundColor: colors.surface, 
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 20, 
        fontWeight: 'bold' 
      }}>
        {title}
      </Text>
    </View>
  );
}
```

## Example 5: Status Badge with Semantic Colors

```typescript
import { View, Text } from 'react-native';
import { useThemedStyles, createThemedStyles } from '@/lib/theme/styles';

type Status = 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  status: Status;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = useThemedStyles((theme) => createStyles(theme, status));
  
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: Theme, status: Status) => {
  const getColor = () => {
    switch (status) {
      case 'success': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'error': return theme.colors.error;
      case 'info': return theme.colors.info;
    }
  };
  
  return {
    badge: {
      backgroundColor: getColor(),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    label: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
  };
};
```

## Example 6: Form Input with Theme-Aware Styling

```typescript
import { View, Text, TextInput } from 'react-native';
import { useThemedStyles, createThemedStyles } from '@/lib/theme/styles';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function Input({ label, value, onChangeText, error }: InputProps) {
  const styles = useThemedStyles((theme) => createStyles(theme, !!error));
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={styles.placeholder.color}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme, hasError: boolean) => ({
  container: {
    marginBottom: 16,
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: hasError ? theme.colors.error : theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholder: {
    color: theme.colors.textTertiary,
  },
  error: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
```

## Example 7: Using `useConditionalStyle()` for Quick Styling

```typescript
import { View, Text } from 'react-native';
import { useConditionalStyle } from '@/lib/theme/styles';

export function QuickCard({ title }: { title: string }) {
  const containerStyle = useConditionalStyle(
    { 
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
    },
    { 
      backgroundColor: '#1f2937',
      borderColor: '#374151',
    }
  );
  
  const textStyle = useConditionalStyle(
    { color: '#111827' },
    { color: '#f9fafb' }
  );
  
  return (
    <View style={[{ padding: 16, borderWidth: 1, borderRadius: 8 }, containerStyle]}>
      <Text style={[{ fontSize: 16, fontWeight: '600' }, textStyle]}>
        {title}
      </Text>
    </View>
  );
}
```

## Example 8: Complex Component with Multiple Style Sections

```typescript
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useThemedStyles, createThemedStyles, useThemedShadow } from '@/lib/theme/styles';

interface ProfileCardProps {
  name: string;
  role: string;
  avatar: string;
  stats: { label: string; value: string }[];
  onPress: () => void;
}

export function ProfileCard({ name, role, avatar, stats, onPress }: ProfileCardProps) {
  const styles = useThemedStyles(createStyles);
  const shadow = useThemedShadow('md');
  
  return (
    <TouchableOpacity style={[styles.container, shadow]} onPress={onPress}>
      <View style={styles.header}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
        </View>
      </View>
      
      <View style={styles.stats}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = createThemedStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  role: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
}));
```

## Best Practices

1. **Use `createThemedStyles()` wrapper** for better type safety and consistency
2. **Memoize style creators** outside the component when possible
3. **Use semantic color names** (text, background, primary) instead of specific colors
4. **Combine with `useThemedShadow()`** for consistent shadow styling
5. **Test in both light and dark modes** to ensure proper contrast
6. **Use `useThemeColors()`** for simple inline styles
7. **Use `useThemedStyles()`** for complex component styling

## Performance Tips

- Style creators are memoized and only recalculated when theme changes
- Avoid creating new style objects on every render
- Use `useMemo` for computed styles that depend on props
- Keep style creators pure (no side effects)

## Accessibility

All theme colors are designed to meet WCAG AA contrast requirements:
- Normal text: 4.5:1 contrast ratio
- Large text and UI components: 3:1 contrast ratio

Always test your components with both themes to ensure readability.
