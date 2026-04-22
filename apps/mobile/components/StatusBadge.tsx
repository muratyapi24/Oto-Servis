import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radius } from "../constants/theme";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:          { bg: "#fef3c7", text: "#b45309", label: "Bekliyor" },
  IN_PROGRESS:      { bg: "#dbeafe", text: Colors.primaryContainer, label: "Devam Ediyor" },
  WAITING_APPROVAL: { bg: "#ffedd5", text: "#c2410c", label: "Onay Bekliyor" },
  COMPLETED:        { bg: "#d1fae5", text: Colors.secondary, label: "Tamamlandı" },
  CANCELLED:        { bg: "#fee2e2", text: Colors.error, label: "İptal" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { bg: Colors.surfaceContainer, text: Colors.outline, label: status };
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
