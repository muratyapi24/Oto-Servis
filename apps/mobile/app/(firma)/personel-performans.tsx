import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function PersonelPerformansScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-personel-detay", id],
    queryFn: () => api.firmaPersonelDetay(id) as Promise<any>,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Performans Raporu" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      </SafeAreaView>
    );
  }

  const mechanic = data?.mechanic ?? data;
  const performance = data?.performance ?? {};
  const activeOrders: any[] = data?.activeOrders ?? [];

  if (!mechanic) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Performans Raporu" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Veri bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedCount = performance.completedCount ?? mechanic.completedOrderCount ?? 0;
  const activeCount = performance.activeCount ?? mechanic.activeOrderCount ?? 0;
  const avgMinutes = performance.avgDurationMinutes ?? 0;

  // Workload bar: activeCount / 10, capped at 100%
  const workloadPercent = Math.min((activeCount / 10) * 100, 100);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Performans Raporu" onBack={() => router.back()} />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Mechanic name header */}
        <View style={[styles.nameCard, Shadow.navy]}>
          <Text style={styles.mechanicName}>
            {mechanic.firstName ?? ""} {mechanic.lastName ?? ""}
          </Text>
          <Text style={styles.mechanicSub}>Performans Metrikleri</Text>
        </View>

        {/* Metrics */}
        <View style={[styles.metricsCard, Shadow.navy]}>
          <MetricRow
            label="Tamamlanan İş"
            value={String(completedCount)}
            color={Colors.secondary}
          />
          <View style={styles.divider} />
          <MetricRow
            label="Aktif İş Sayısı"
            value={String(activeCount)}
            color={Colors.primaryContainer}
          />
          <View style={styles.divider} />
          <MetricRow
            label="Ortalama Süre"
            value={formatDuration(avgMinutes)}
            color={Colors.onSurface}
          />
        </View>

        {/* Workload Bar */}
        <Text style={styles.sectionTitle}>İş Yükü</Text>
        <View style={[styles.workloadCard, Shadow.navy]}>
          <View style={styles.workloadHeader}>
            <Text style={styles.workloadLabel}>Aktif İş / Kapasite</Text>
            <Text style={styles.workloadPercent}>
              {Math.round(workloadPercent)}%
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${workloadPercent}%` as any,
                  backgroundColor:
                    workloadPercent >= 80
                      ? Colors.error
                      : workloadPercent >= 50
                      ? "#b45309"
                      : Colors.secondary,
                },
              ]}
            />
          </View>
          <Text style={styles.workloadHint}>
            {activeCount} aktif iş / 10 kapasite
          </Text>
        </View>

        {/* Active Orders */}
        <Text style={styles.sectionTitle}>Aktif İş Emirleri</Text>
        {activeOrders.length === 0 ? (
          <View style={[styles.emptyCard, Shadow.navy]}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Aktif iş emri bulunmuyor</Text>
          </View>
        ) : (
          activeOrders.map((order: any) => (
            <View key={order.id} style={[styles.orderCard, Shadow.navy]}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderPlate}>
                  {order.plate ?? order.vehicle?.plate ?? "—"}
                </Text>
                <StatusBadge status={order.status} size="sm" />
              </View>
              <Text style={styles.orderModel} numberOfLines={1}>
                {order.vehicleModel ?? order.vehicle?.model ?? "—"}
              </Text>
              <Text style={styles.orderComplaint} numberOfLines={2}>
                {order.complaintDescription ?? order.complaint ?? "—"}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} saat ${m} dk` : `${h} saat`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  nameCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 4,
  },
  mechanicName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  mechanicSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },

  metricsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 4,
    overflow: "hidden",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.outline,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: -4,
  },

  workloadCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
  },
  workloadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workloadLabel: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "500",
  },
  workloadPercent: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  barTrack: {
    height: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  workloadHint: {
    fontSize: 11,
    color: Colors.outline,
  },

  orderCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    gap: 6,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderPlate: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  orderModel: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "500",
  },
  orderComplaint: {
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 18,
  },

  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: {
    fontSize: 14,
    color: Colors.outline,
  },
});
