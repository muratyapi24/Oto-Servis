import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Radius, Shadow } from "../constants/theme";
import { StatusBadge } from "./StatusBadge";

interface ServiceCardOrder {
  id: string;
  plate: string;
  vehicleModel: string;
  complaint: string;
  status: string;
  isUrgent: boolean;
  mechanicName?: string;
  completionPercentage: number;
}

interface ServiceCardProps {
  order: ServiceCardOrder;
  onPress: () => void;
  showPriorityBorder?: boolean;
}

export function ServiceCard({ order, onPress, showPriorityBorder = true }: ServiceCardProps) {
  const borderColor = order.isUrgent ? Colors.error : Colors.primaryContainer;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        Shadow.navy,
        showPriorityBorder && { borderLeftColor: borderColor, borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.plateRow}>
          <Text style={styles.plate}>{order.plate}</Text>
          {order.isUrgent && (
            <View style={styles.acilBadge}>
              <Text style={styles.acilText}>ACİL</Text>
            </View>
          )}
        </View>
        <StatusBadge status={order.status} size="sm" />
      </View>

      <Text style={styles.model} numberOfLines={1}>
        {order.vehicleModel}
      </Text>
      <Text style={styles.complaint} numberOfLines={2}>
        {order.complaint}
      </Text>

      <View style={styles.footer}>
        {order.mechanicName ? (
          <Text style={styles.mechanic}>👤 {order.mechanicName}</Text>
        ) : null}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${order.completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{order.completionPercentage}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plate: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  acilBadge: {
    backgroundColor: Colors.error,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  acilText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  model: {
    fontSize: 13,
    color: Colors.outline,
    marginBottom: 4,
  },
  complaint: {
    fontSize: 14,
    color: Colors.onSurface,
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mechanic: {
    fontSize: 12,
    color: Colors.outline,
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressTrack: {
    width: 60,
    height: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.outline,
    fontWeight: "600",
  },
});
