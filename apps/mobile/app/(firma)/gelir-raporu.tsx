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
import { ProgressBar } from "@/components/ProgressBar";
import { Colors, Radius, Shadow } from "@/constants/theme";

const CATEGORIES = [
  { label: "Servis İşçiliği", ratio: 0.55, color: Colors.primaryContainer },
  { label: "Yedek Parça", ratio: 0.30, color: Colors.secondary },
  { label: "Diğer", ratio: 0.15, color: Colors.outline },
];

export default function GelirRaporuScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-finans"],
    queryFn: () => api.firmaFinans() as Promise<any>,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const monthlyRevenue: number = data?.monthlyRevenue ?? 0;
  const prevMonthRevenue = 0; // placeholder
  const diff = monthlyRevenue - prevMonthRevenue;
  const fmt = (v: number) => `₺${v.toLocaleString("tr-TR")}`;

  const now = new Date();
  const monthLabel = now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const prevMonthLabel = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Gelir Raporu" onBack={() => router.back()} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, Shadow.navy]}>
          <Text style={styles.heroLabel}>Aylık Toplam Gelir</Text>
          <Text style={styles.heroValue}>{fmt(monthlyRevenue)}</Text>
          <Text style={styles.heroPeriod}>{monthLabel}</Text>
        </View>

        {/* Category Breakdown */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.sectionTitle}>Kategori Dağılımı</Text>
          {CATEGORIES.map((cat) => {
            const amount = Math.round(monthlyRevenue * cat.ratio);
            return (
              <View key={cat.label} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catAmount}>{fmt(amount)}</Text>
                </View>
                <ProgressBar value={cat.ratio * 100} color={cat.color} height={8} />
              </View>
            );
          })}
        </View>

        {/* Monthly Comparison */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.sectionTitle}>Aylık Karşılaştırma</Text>
          <View style={styles.compRow}>
            <View style={styles.compItem}>
              <Text style={styles.compPeriod}>{prevMonthLabel}</Text>
              <Text style={styles.compValue}>{fmt(prevMonthRevenue)}</Text>
            </View>
            <View style={styles.compArrow}>
              <Text style={[styles.compDiff, { color: diff >= 0 ? Colors.secondary : Colors.error }]}>
                {diff >= 0 ? "↑" : "↓"} {fmt(Math.abs(diff))}
              </Text>
            </View>
            <View style={styles.compItem}>
              <Text style={styles.compPeriod}>{monthLabel}</Text>
              <Text style={[styles.compValue, { color: Colors.primaryContainer }]}>
                {fmt(monthlyRevenue)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  heroCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  heroPeriod: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },

  catRow: { gap: 6 },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catLabel: { fontSize: 13, fontWeight: "600", color: Colors.onSurface },
  catAmount: { fontSize: 13, fontWeight: "700", color: Colors.onSurface },

  compRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compItem: { flex: 1, alignItems: "center", gap: 4 },
  compPeriod: { fontSize: 11, color: Colors.outline, fontWeight: "500" },
  compValue: { fontSize: 16, fontWeight: "800", color: Colors.onSurface },
  compArrow: { alignItems: "center", paddingHorizontal: 8 },
  compDiff: { fontSize: 13, fontWeight: "700" },
});
