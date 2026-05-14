/**
 * Example Component Demonstrating Theme-Aware Style Utilities
 * 
 * This component showcases all the different ways to use the theme utilities.
 * It's meant as a reference implementation for developers.
 * 
 * **Validates: Requirements 7.6**
 */

import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useThemedStyles, createThemedStyles, useThemeColors, useThemedShadow, useConditionalStyle } from './styles';

/**
 * Example 1: Using useThemedStyles (Recommended)
 */
function ThemedCard() {
  const styles = useThemedStyles(createCardStyles);
  const shadow = useThemedShadow('md');
  
  return (
    <View style={[styles.card, shadow]}>
      <Text style={styles.title}>Themed Card</Text>
      <Text style={styles.description}>
        This card uses useThemedStyles for comprehensive theme support.
      </Text>
    </View>
  );
}

const createCardStyles = createThemedStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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

/**
 * Example 2: Using useThemeColors (Simple)
 */
function SimpleHeader() {
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
        Simple Header
      </Text>
      <Text style={{ 
        color: colors.textSecondary, 
        fontSize: 14,
        marginTop: 4,
      }}>
        Using useThemeColors for inline styles
      </Text>
    </View>
  );
}

/**
 * Example 3: Using useConditionalStyle (Quick)
 */
function QuickButton({ onPress, label }: { onPress: () => void; label: string }) {
  const buttonStyle = useConditionalStyle(
    { 
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
    },
    { 
      backgroundColor: '#60a5fa',
      borderColor: '#3b82f6',
    }
  );
  
  return (
    <TouchableOpacity 
      style={[
        { 
          padding: 12, 
          borderRadius: 8, 
          borderWidth: 1,
          alignItems: 'center',
        }, 
        buttonStyle
      ]}
      onPress={onPress}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Example 4: Status Badge with Dynamic Styling
 */
type Status = 'success' | 'warning' | 'error' | 'info';

function StatusBadge({ status, label }: { status: Status; label: string }) {
  const styles = useThemedStyles((theme) => createStatusStyles(theme, status));
  
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStatusStyles = (theme: any, status: Status) => {
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
      alignSelf: 'flex-start' as const,
    },
    label: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600' as const,
    },
  };
};

/**
 * Main Example Screen
 * 
 * Demonstrates all the different utility approaches in one place.
 */
export function ThemeUtilitiesExample() {
  const styles = useThemedStyles(createMainStyles);
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Theme Utilities Examples</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. useThemedStyles (Recommended)</Text>
        <ThemedCard />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. useThemeColors (Simple)</Text>
        <SimpleHeader />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. useConditionalStyle (Quick)</Text>
        <QuickButton label="Quick Button" onPress={() => {}} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Dynamic Status Badges</Text>
        <View style={styles.badgeRow}>
          <StatusBadge status="success" label="Success" />
          <StatusBadge status="warning" label="Warning" />
          <StatusBadge status="error" label="Error" />
          <StatusBadge status="info" label="Info" />
        </View>
      </View>
    </ScrollView>
  );
}

const createMainStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
}));
