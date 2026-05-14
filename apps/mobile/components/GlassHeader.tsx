import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, DarkColors, Shadow, Radius } from "../constants/theme";
import { useTheme } from "./theme-provider";

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export function GlassHeader({ title, subtitle, rightAction, onBack }: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? DarkColors : Colors;

  return (
    <View
      style={[
        styles.container,
        { 
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? "rgba(31,33,35,0.85)" : "rgba(255,255,255,0.85)",
        },
        Shadow.navy,
      ]}
    >
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceContainerLow }]}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.backIcon, { color: colors.onSurface }]}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.outline }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "600",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  rightAction: {
    marginLeft: 8,
  },
});
