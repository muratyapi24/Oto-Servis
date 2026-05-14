import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, DarkColors, Radius, Shadow } from "../constants/theme";
import { useTheme } from "./theme-provider";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: string;
  variant?: "primary" | "surface" | "success" | "warning";
  trend?: { value: number; direction: "up" | "down" };
  onPress?: () => void;
}

const VARIANT_STYLES = {
  light: {
    primary: {
      bg: Colors.primaryContainer,
      text: "#ffffff",
      subText: "rgba(255,255,255,0.75)",
    },
    surface: {
      bg: Colors.surfaceContainerLowest,
      text: Colors.onSurface,
      subText: Colors.outline,
    },
    success: {
      bg: "#ecfdf5",
      text: Colors.secondary,
      subText: Colors.outline,
    },
    warning: {
      bg: "#fffbeb",
      text: "#b45309",
      subText: Colors.outline,
    },
  },
  dark: {
    primary: {
      bg: DarkColors.primaryContainer,
      text: "#ffffff",
      subText: "rgba(255,255,255,0.75)",
    },
    surface: {
      bg: DarkColors.surfaceContainerLowest,
      text: DarkColors.onSurface,
      subText: DarkColors.outline,
    },
    success: {
      bg: "#064e3b",
      text: DarkColors.secondary,
      subText: DarkColors.outline,
    },
    warning: {
      bg: "#78350f",
      text: "#fbbf24",
      subText: DarkColors.outline,
    },
  },
};

export function KpiCard({
  label,
  value,
  icon,
  variant = "surface",
  trend,
  onPress,
}: KpiCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const v = VARIANT_STYLES[isDark ? "dark" : "light"][variant];
  const colors = isDark ? DarkColors : Colors;

  const content = (
    <View style={[styles.card, { backgroundColor: v.bg }, Shadow.navy]}>
      <View style={styles.header}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        {trend ? (
          <View style={[styles.trendBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }]}>
            <Text style={[styles.trendText, { color: trend.direction === "up" ? colors.secondary : colors.error }]}>
              {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: v.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: v.subText }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.wrapper}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.wrapper}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    borderRadius: Radius.lg,
    padding: 16,
    minHeight: 100,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  icon: {
    fontSize: 22,
  },
  trendBadge: {
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
});
