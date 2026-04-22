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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { KpiCard } from "@/components/KpiCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Colors, Radius, Shadow } from "@/constants/theme";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  IN_PROGRESS: "Devam Ediyor",
  WAITING_APPROVAL: "Onay Bekliyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#b45309",
  IN_PROGRESS: Colors.primaryContainer,
  WAITING_APPROVAL: "#c2410c",
  COMPLETED: Colors.secondary,
  CANCELLED: Colors.error,
};

export default function ServisRaporuScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-panel"],
    queryFn: () => api.firmaPanel() as Promise<any>,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const overview = data?.overview ?? {};
  const total: number =
    (overview.activeServicesCount ?? 0) + (overview.completedTodayCount ?? 0);
  const completed: number = overview.completedTodayCount ?? 0;
  const active: number = overview.activeServicesCount ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Build status distribution from available data
  const statusDist = [
    { status: "IN_PROGRESS", count: active },
    { status: "COMPLETED", count: completed },
    { status: "WAITING_APPROVAL", count: overview.approvalQueue?.length ?? 0 },
  ].filter((s) => s.count > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Servis Raporu" onBack={() => router.back()} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KpiCard label="Toplam Servis" value={total} icon="🔧" variant="primary" />
            <KpiCard label="Tamamlanan" value={completed} icon="✅" variant="success" />
          </View>
          <View style={styles.kpiRow}>
            <KpiCard label="Devam Eden" value={active} icon="⚙️" variant="surface" />
            <KpiCard label="Ort. Süre" value="—" icon="⏱️" variant="surface" />
          </View>
        </View>

        {/* Completion Rate */}
        <View style={[styles.card, Shadow.navy]}>
          <View style={styles.rateHeader}>
            <Text style={styles.sectionTitle}>Tamamlanma Oranı</Text>
            <Text style={styles.rateValue}>{completionRate}%</Text>
          </View>
          <ProgressBar value={completionRate} color={Colors.secondary} height={10} />
          <Text style={styles.rateNote}>
            {completed} / {total} servis tamamlandı
          </Text>
        </View>

        {/* Status Distribution */}
        {statusDist.length > 0 && (
          <View style={[styles.card, Shadow.navy]}>
            <Text style={styles.sectionTitle}>Durum Dağılımı</Text>
            {statusDist.map((item) => (
              <View key={item.status} style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_COLORS[item.status] ?? Colors.outline },
                  ]}
                />
                <Text style={styles.statusLabel}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
                <Text style={styles.statusCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  kpiGrid: { gap: 10 },
  kpiRow: { flexDirection: "row", gap: 10 },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },

  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.secondary,
  },
  rateNote: {
    fontSize: 12,
    color: Colors.outline,
    fontWeight: "500",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: "500",
  },
  statusCount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
});
