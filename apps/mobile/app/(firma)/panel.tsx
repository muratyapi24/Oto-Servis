import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { KpiCard } from "@/components/KpiCard";
import { Radius, Shadow } from "@/constants/theme";
import { useThemeColors } from "@/lib/theme/useThemeColors";

const PERIOD_OPTIONS = [
  { label: "Bugün", value: "today" },
  { label: "Bu Hafta", value: "week" },
  { label: "Bu Ay", value: "month" },
];

const BAY_STATUS_LABELS: Record<string, string> = {
  OCCUPIED: "Dolu",
  WAITING: "Bekliyor",
  EMPTY: "Boş",
};

export default function FirmaPanelScreen() {
  const [period, setPeriod] = useState("today");
  const colors = useThemeColors();

  const BAY_STATUS_COLORS: Record<string, string> = {
    OCCUPIED: colors.primaryContainer,
    WAITING: "#b45309",
    EMPTY: colors.surfaceContainerHigh,
  };

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-panel"],
    queryFn: () => api.firmaPanel() as Promise<any>,
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  const overview = data?.overview;
  if (!overview) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Veri yüklenemedi</Text>
      </View>
    );
  }

  const fmt = (v: number) => `₺${(v ?? 0).toLocaleString("tr-TR")}`;
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const weeklyChart: { day: string; revenue: number }[] =
    overview.weeklyChart ?? [];
  const maxRevenue = Math.max(...weeklyChart.map((d: any) => d.revenue), 1);

  const bayStatus: { bayId: string; plate?: string; status: string }[] =
    overview.bayStatus ?? [];

  const escalations: any[] = overview.escalations ?? [];
  const approvalQueue: any[] = overview.approvalQueue ?? [];
  const criticalParts: any[] = overview.criticalParts ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <GlassHeader
        title={overview.firmName ?? "Panel"}
        subtitle={today}
      />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Filter */}
        <View style={[styles.periodRow, { backgroundColor: colors.surfaceContainer }]}>
          {PERIOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setPeriod(opt.value)}
              style={[
                styles.periodBtn,
                period === opt.value && { backgroundColor: colors.primaryContainer },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.periodLabel,
                  { color: colors.onSurface },
                  period === opt.value && styles.periodLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPI Bento Grid 2x2 */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoRow}>
            <KpiCard
              label="Günlük Ciro"
              value={fmt(overview.dailyRevenue)}
              icon="💰"
              variant="primary"
            />
            <KpiCard
              label="Servisteki Araç"
              value={String(overview.activeServicesCount ?? 0).padStart(2, "0")}
              icon="🚗"
              variant="surface"
            />
          </View>
          <View style={styles.bentoRow}>
            <KpiCard
              label="Bugün Tamamlanan"
              value={String(overview.completedTodayCount ?? 0).padStart(2, "0")}
              icon="✅"
              variant="success"
            />
            <KpiCard
              label="Kritik Uyarı"
              value={String(overview.criticalAlertCount ?? 0).padStart(2, "0")}
              icon="⚠️"
              variant="warning"
            />
          </View>
        </View>

        {/* Weekly Bar Chart */}
        {weeklyChart.length > 0 && (
          <View style={[styles.card, Shadow.navy, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Haftalık Performans</Text>
            <View style={styles.chartContainer}>
              {weeklyChart.map((item: any, idx: number) => {
                const barHeight = Math.max(
                  4,
                  Math.round((item.revenue / maxRevenue) * 80)
                );
                return (
                  <View key={idx} style={styles.chartBar}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: colors.primaryContainer,
                        },
                      ]}
                    />
                    <Text style={[styles.chartLabel, { color: colors.outline }]}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Bay Status Grid */}
        {bayStatus.length > 0 && (
          <View style={[styles.card, Shadow.navy, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Lift Durumu</Text>
            <View style={styles.bayGrid}>
              {bayStatus.map((bay) => (
                <View
                  key={bay.bayId}
                  style={[
                    styles.bayCell,
                    {
                      backgroundColor:
                        BAY_STATUS_COLORS[bay.status] ??
                        colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <Text style={styles.bayId}>{bay.bayId}</Text>
                  {bay.plate ? (
                    <Text style={styles.bayPlate} numberOfLines={1}>
                      {bay.plate}
                    </Text>
                  ) : null}
                  <Text style={styles.bayStatusLabel}>
                    {BAY_STATUS_LABELS[bay.status] ?? bay.status}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Critical Alerts */}
        {(escalations.length > 0 ||
          approvalQueue.length > 0 ||
          criticalParts.length > 0) && (
          <View style={[styles.card, Shadow.navy, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Kritik Uyarılar</Text>

            {escalations.map((esc: any) => (
              <View key={esc.id} style={styles.alertRow}>
                <View
                  style={[
                    styles.alertDot,
                    { backgroundColor: colors.error },
                  ]}
                />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.onSurface }]}>
                    {esc.vehicle?.plate ?? "—"}
                  </Text>
                  <Text style={[styles.alertDesc, { color: colors.outline }]} numberOfLines={1}>
                    {esc.complaintDescription}
                  </Text>
                </View>
                <View style={[styles.acilBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.acilText}>ACİL</Text>
                </View>
              </View>
            ))}

            {approvalQueue.map((order: any) => (
              <View key={order.id} style={styles.alertRow}>
                <View
                  style={[
                    styles.alertDot,
                    { backgroundColor: "#b45309" },
                  ]}
                />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.onSurface }]}>
                    {order.vehicle?.plate ?? "—"}
                  </Text>
                  <Text style={[styles.alertDesc, { color: colors.outline }]} numberOfLines={1}>
                    Onay bekliyor — {fmt(order.totalAmount ?? 0)}
                  </Text>
                </View>
              </View>
            ))}

            {criticalParts.map((part: any) => (
              <View key={part.id} style={styles.alertRow}>
                <View
                  style={[
                    styles.alertDot,
                    { backgroundColor: "#b45309" },
                  ]}
                />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.onSurface }]}>{part.name}</Text>
                  <Text style={[styles.alertDesc, { color: colors.outline }]}>
                    Stok: {part.currentStock} / Min: {part.minStockLevel}
                  </Text>
                </View>
                <View style={styles.warnBadge}>
                  <Text style={styles.warnText}>Kritik</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16 },

  periodRow: {
    flexDirection: "row",
    borderRadius: Radius.md,
    padding: 3,
    gap: 2,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radius.sm,
    minHeight: 48,
    justifyContent: "center",
  },
  periodBtnActive: {
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  periodLabelActive: {
    color: "#fff",
  },

  bentoGrid: { gap: 10 },
  bentoRow: { flexDirection: "row", gap: 10 },

  card: {
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 100,
    paddingTop: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  bar: {
    width: "100%",
    borderRadius: Radius.sm,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: "500",
  },

  bayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bayCell: {
    width: "30%",
    borderRadius: Radius.md,
    padding: 10,
    alignItems: "center",
    gap: 2,
    minHeight: 72,
    justifyContent: "center",
  },
  bayId: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  bayPlate: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  bayStatusLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },

  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertContent: { flex: 1 },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  alertDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  acilBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  acilText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  warnBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  warnText: {
    color: "#b45309",
    fontSize: 10,
    fontWeight: "700",
  },
});
