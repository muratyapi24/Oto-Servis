import React from "react";
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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function FinansScreen() {
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

  const {
    monthlyRevenue = 0,
    pendingInvoices = [],
    weeklyTrend = [],
  } = data ?? {};

  const monthlyExpense = 0;
  const net = monthlyRevenue - monthlyExpense;

  const fmt = (v: number) => `₺${(v ?? 0).toLocaleString("tr-TR")}`;
  const dt = (d: string) =>
    new Date(d).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    });

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const maxTrend = Math.max(...weeklyTrend.map((d: any) => d.revenue ?? 0), 1);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Finansal Özet" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Aylık Özet</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroItem}>
              <Text style={styles.heroItemLabel}>Gelir</Text>
              <Text style={styles.heroItemValue}>{fmt(monthlyRevenue)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroItem}>
              <Text style={styles.heroItemLabel}>Gider</Text>
              <Text style={styles.heroItemValue}>{fmt(monthlyExpense)}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroItem}>
              <Text style={styles.heroItemLabel}>Net</Text>
              <Text style={[styles.heroItemValue, styles.heroNet]}>
                {fmt(net)}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Trend Chart */}
        {weeklyTrend.length > 0 && (
          <View style={[styles.card, Shadow.navy]}>
            <Text style={styles.sectionTitle}>Haftalık Trend</Text>
            <View style={styles.chartContainer}>
              {weeklyTrend.map((item: any, idx: number) => {
                const barHeight = Math.max(
                  4,
                  Math.round(((item.revenue ?? 0) / maxTrend) * 72)
                );
                return (
                  <View key={idx} style={styles.chartBar}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: Colors.secondary,
                        },
                      ]}
                    />
                    <Text style={styles.chartLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Pending Receivables */}
        {pendingInvoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bekleyen Tahsilatlar</Text>
            {pendingInvoices.map((inv: any) => {
              const overdue = isOverdue(inv.dueDate);
              return (
                <View
                  key={inv.id}
                  style={[
                    styles.receivableCard,
                    Shadow.navy,
                    overdue && styles.receivableCardOverdue,
                  ]}
                >
                  <View style={styles.receivableHeader}>
                    <Text style={styles.receivableName} numberOfLines={1}>
                      {inv.customer?.firstName ?? ""}{" "}
                      {inv.customer?.lastName ?? ""}
                      {inv.customer?.companyName ?? ""}
                    </Text>
                    <Text
                      style={[
                        styles.receivableAmount,
                        overdue && { color: Colors.error },
                      ]}
                    >
                      {fmt(inv.totalAmount - (inv.paidAmount ?? 0))}
                    </Text>
                  </View>
                  <View style={styles.receivableFooter}>
                    <Text style={styles.receivableInvoice}>
                      {inv.invoiceNumber ?? "Taslak"}
                    </Text>
                    <View style={styles.receivableRight}>
                      {overdue && (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueText}>Gecikmiş</Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.receivableDue,
                          overdue && { color: Colors.error },
                        ]}
                      >
                        {inv.dueDate ? dt(inv.dueDate) : "Vade yok"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Collection Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push("/(firma)/tahsilat-ekle" as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Hızlı Tahsilat Al</Text>
        </TouchableOpacity>
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
    gap: 16,
    ...Shadow.navy,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroItemLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  heroItemValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  heroNet: {
    color: Colors.secondaryContainer,
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

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

  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 88,
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
    color: Colors.outline,
    fontWeight: "500",
  },

  section: { gap: 10 },

  receivableCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    gap: 8,
  },
  receivableCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  receivableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  receivableName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
    flex: 1,
  },
  receivableAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.onSurface,
  },
  receivableFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receivableInvoice: {
    fontSize: 12,
    color: Colors.outline,
  },
  receivableRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overdueBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xl,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.error,
  },
  receivableDue: {
    fontSize: 12,
    color: Colors.outline,
  },

  ctaButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.navy,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
