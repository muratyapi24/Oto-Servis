import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  status: "ODENDI" | "BEKLEMEDE";
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: "p1",
    invoiceNumber: "FTR-2026-00142",
    amount: 1670,
    date: "15 Ocak 2025",
    status: "ODENDI",
  },
  {
    id: "p2",
    invoiceNumber: "FTR-2026-00118",
    amount: 2340,
    date: "28 Aralık 2026",
    status: "ODENDI",
  },
  {
    id: "p3",
    invoiceNumber: "FTR-2026-00095",
    amount: 850,
    date: "10 Kasım 2026",
    status: "BEKLEMEDE",
  },
  {
    id: "p4",
    invoiceNumber: "FTR-2026-00071",
    amount: 3100,
    date: "5 Ekim 2026",
    status: "ODENDI",
  },
  {
    id: "p5",
    invoiceNumber: "FTR-2026-00043",
    amount: 1200,
    date: "18 Ağustos 2026",
    status: "ODENDI",
  },
];

const totalPaid = MOCK_PAYMENTS.filter((p) => p.status === "ODENDI").reduce(
  (sum, p) => sum + p.amount,
  0
);

function StatusBadge({ status }: { status: PaymentRecord["status"] }) {
  const isPaid = status === "ODENDI";
  return (
    <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
      <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextPending]}>
        {isPaid ? "✓ ÖDENDİ" : "⏳ BEKLEMEDE"}
      </Text>
    </View>
  );
}

export default function OdemelerScreen() {
  if (MOCK_PAYMENTS.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Ödeme Geçmişi" onBack={() => router.back()} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>Ödeme geçmişi yok</Text>
          <Text style={styles.emptySubtitle}>
            Henüz bir ödeme işlemi gerçekleştirilmedi
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Ödeme Geçmişi" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Row */}
        <View style={[styles.summaryCard, Shadow.navy]}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Toplam Ödenen</Text>
            <Text style={styles.summaryAmount}>
              ₺{totalPaid.toLocaleString("tr-TR")}
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryCount}>
              {MOCK_PAYMENTS.filter((p) => p.status === "ODENDI").length}
            </Text>
            <Text style={styles.summaryCountLabel}>işlem</Text>
          </View>
        </View>

        {/* Payment List */}
        {(__DEV__ ? MOCK_PAYMENTS : []).map((payment) => (
          <TouchableOpacity
            key={payment.id}
            style={[styles.paymentCard, Shadow.navy]}
            onPress={() =>
              router.push(`/(musteri)/makbuz/${payment.id}` as any)
            }
            activeOpacity={0.8}
          >
            <View style={styles.paymentTop}>
              <Text style={styles.invoiceNumber}>{payment.invoiceNumber}</Text>
              <StatusBadge status={payment.status} />
            </View>
            <View style={styles.paymentBottom}>
              <Text style={styles.paymentDate}>{payment.date}</Text>
              <Text style={styles.paymentAmount}>
                ₺{payment.amount.toLocaleString("tr-TR")}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 10, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryLeft: { gap: 4 },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  summaryRight: { alignItems: "center" },
  summaryCount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  summaryCountLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },

  paymentCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
    minHeight: 80,
  },
  paymentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
    letterSpacing: 0.3,
  },
  paymentBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentDate: { fontSize: 12, color: Colors.outline },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.onSurface,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  badgePaid: { backgroundColor: "#d1fae5" },
  badgePending: { backgroundColor: "#fef3c7" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextPaid: { color: Colors.secondary },
  badgeTextPending: { color: "#92400e" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
  },
});
