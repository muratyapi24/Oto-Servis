import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, DarkColors, Radius } from "../constants/theme";
import { useTheme } from "./theme-provider";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_MAP_LIGHT: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:          { bg: "#fef3c7", text: "#b45309", label: "Bekliyor" },
  IN_PROGRESS:      { bg: "#dbeafe", text: Colors.primaryContainer, label: "Devam Ediyor" },
  WAITING_APPROVAL: { bg: "#ffedd5", text: "#c2410c", label: "Onay Bekliyor" },
  COMPLETED:        { bg: "#d1fae5", text: Colors.secondary, label: "Tamamlandı" },
  CANCELLED:        { bg: "#fee2e2", text: Colors.error, label: "İptal" },
};

const STATUS_MAP_DARK: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:          { bg: "#78350f", text: "#fbbf24", label: "Bekliyor" },
  IN_PROGRESS:      { bg: "#1e3a8a", text: "#93c5fd", label: "Devam Ediyor" },
  WAITING_APPROVAL: { bg: "#7c2d12", text: "#fdba74", label: "Onay Bekliyor" },
  COMPLETED:        { bg: "#064e3b", text: "#6cf8bb", label: "Tamamlandı" },
  CANCELLED:        { bg: "#7f1d1d", text: "#fca5a5", label: "İptal" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? DarkColors : Colors;
  const STATUS_MAP = isDark ? STATUS_MAP_DARK : STATUS_MAP_LIGHT;
  
  const config = STATUS_MAP[status] ?? { 
    bg: colors.surfaceContainer, 
    text: colors.outline, 
    label: status 
  };
  const isSmall = size === "sm";

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      <Text style={[styles.text, { color: config.text }, isSmall && styles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.xl,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  textSm: {
    fontSize: 10,
  },
});
