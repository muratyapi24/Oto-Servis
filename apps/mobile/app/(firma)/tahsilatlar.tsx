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
import { Colors, Radius, Shadow } from "@/constants/theme";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Nakit",
  CARD: "Kredi Kartı",
  TRANSFER: "Havale",
  CREDIT_CARD: "Kredi Kartı",
  BANK_TRANSFER: "Havale",
};

export default function TahsilatlarScreen() {
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

  const payments: any[] = data?.recentPayments ?? [];
  const totalCollected = payments.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);
  const fmt = (v: number) => `₺${v.toLocaleString("tr-TR")}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Tahsilatlar" onBack={() => router.back()} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Row */}
        <View style={[styles.summaryCard, Shadow.navy]}>
          <Text style={styles.summaryLabel}>Toplam Tahsilat</Text>
          <Text style={styles.summaryValue}>{fmt(totalCollected)}</Text>
          <Text style={styles.summaryCount}>{payments.length} işlem</Text>
        </View>

        {/* Payment List */}
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>Tahsilat Bulunamadı</Text>
            <Text style={styles.emptyDesc}>Henüz kayıtlı tahsilat bulunmuyor.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {payments.map((payment: any) => {
              const isIncoming = payment.paymentType === "INCOMING" || !payment.paymentType;
              const customerName = payment.customer
                ? `${payment.customer.firstName ?? ""} ${payment.customer.lastName ?? ""}`.trim() ||
                  payment.customer.companyName ||
                  "Müşteri"
                : "Müşteri";

              return (
                <View key={payment.id} style={[styles.paymentCard, Shadow.navy]}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {customerName}
                    </Text>
                    <Text
                      style={[
                        styles.amount,
                        { color: isIncoming ? Colors.secondary : Colors.error },
                      ]}
                    >
                      {isIncoming ? "+" : "-"}
                      {fmt(payment.amount ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.paymentFooter}>
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>
                        {METHOD_LABELS[payment.paymentMethod ?? ""] ?? payment.paymentMethod ?? "—"}
                      </Text>
                    </View>
                    <Text style={styles.paymentDate}>
                      {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                    </Text>
                  </View>
                </View>
              );
            })}
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

  summaryCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xl,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  summaryCount: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },

  list: { gap: 10 },

  paymentCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    gap: 8,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  customerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  amount: {
    fontSize: 17,
    fontWeight: "800",
  },
  paymentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.xl,
  },
  methodText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.outline,
  },
  paymentDate: {
    fontSize: 12,
    color: Colors.outline,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
  },
});
