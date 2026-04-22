import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ServiceCard } from "@/components/ServiceCard";
import { Colors, Radius, Shadow } from "@/constants/theme";

const SEGMENT_OPTIONS = [
  { label: "Bekleyen", value: "PENDING" },
  { label: "Devam Edenler", value: "IN_PROGRESS" },
];

export default function KuyrukScreen() {
  const [segment, setSegment] = useState("PENDING");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-kuyruk"],
    queryFn: () => api.firmaKuyruk() as Promise<any>,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const orders: any[] = data?.orders ?? [];

  const pending = orders.filter((o) => o.status === "PENDING");
  const inProgress = orders.filter((o) => o.status === "IN_PROGRESS");
  const completed = orders.filter((o) => o.status === "COMPLETED");

  const filtered = orders.filter((o) => o.status === segment);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Servis Kuyruğu" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Summary Strip */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pending.length}</Text>
            <Text style={styles.summaryLabel}>Bekleyen</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.primaryContainer }]}>
              {inProgress.length}
            </Text>
            <Text style={styles.summaryLabel}>Devam Eden</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.secondary }]}>
              {completed.length}
            </Text>
            <Text style={styles.summaryLabel}>Tamamlanan</Text>
          </View>
        </View>

        {/* Segmented Control */}
        <SegmentedControl
          options={SEGMENT_OPTIONS}
          selected={segment}
          onChange={setSegment}
        />

        {/* Service Card List */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyText}>
              {segment === "PENDING"
                ? "Bekleyen iş emri yok"
                : "Devam eden iş emri yok"}
            </Text>
          </View>
        ) : (
          filtered.map((order: any) => (
            <ServiceCard
              key={order.id}
              order={{
                id: order.id,
                plate: order.vehicle?.plate ?? "—",
                vehicleModel: `${order.vehicle?.brand ?? ""} ${order.vehicle?.model ?? ""}`.trim(),
                complaint: order.complaintDescription ?? "",
                status: order.status,
                isUrgent: order.isUrgent ?? false,
                mechanicName: order.assignedMechanic
                  ? `${order.assignedMechanic.firstName} ${order.assignedMechanic.lastName}`
                  : undefined,
                completionPercentage: order.completionPercentage ?? 0,
              }}
              onPress={() =>
                router.push(`/(firma)/servis-detay/${order.id}` as any)
              }
              showPriorityBorder
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  summaryStrip: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: "center",
    ...Shadow.navy,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.onSurface,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.outline,
    fontWeight: "500",
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.outlineVariant,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontSize: 15,
    color: Colors.outline,
    fontWeight: "500",
  },
});
