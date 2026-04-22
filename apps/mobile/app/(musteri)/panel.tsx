import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GlassHeader } from "@/components/GlassHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, Radius, Shadow } from "@/constants/theme";

const QUICK_ACTIONS = [
  { label: "Randevu Al", icon: "📅", route: "/(musteri)/randevu" as const },
  { label: "Araç Ekle", icon: "🚗", route: "/(musteri)/randevu" as const },
  { label: "Fatura Öde", icon: "💳", route: "/(musteri)/profil" as const },
  { label: "Canlı Destek", icon: "💬", route: "/(musteri)/profil" as const },
];

export default function MusteriPanelScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["musteri-panel"],
    queryFn: () => api.musteriPanel() as Promise<any>,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  if (error || !data?.customer) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Veri yüklenemedi</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Yeniden Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { customer, vehicles } = data;
  const firstName = customer.firstName ?? "Müşteri";

  // Find active service order across all vehicles
  const activeOrder = vehicles
    ?.flatMap((v: any) => (v.serviceOrders ?? []).map((o: any) => ({ ...o, vehicle: v })))
    .find((o: any) => o.status === "IN_PROGRESS" || o.status === "PENDING" || o.status === "WAITING_APPROVAL");

  // Recent transactions: last 5 completed orders
  const recentOrders = vehicles
    ?.flatMap((v: any) => (v.serviceOrders ?? []).map((o: any) => ({ ...o, vehicle: v })))
    .filter((o: any) => o.status === "COMPLETED")
    .slice(0, 5) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader
        title={`Merhaba, ${firstName}!`}
        rightAction={
          <TouchableOpacity style={styles.bellBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Service Hero Card or CTA */}
        {activeOrder ? (
          <View style={[styles.heroCard, Shadow.navy]}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>Aktif Servis</Text>
                <Text style={styles.heroPlate}>{activeOrder.vehicle?.plate}</Text>
                <Text style={styles.heroVehicle}>
                  {activeOrder.vehicle?.brand} {activeOrder.vehicle?.model}
                </Text>
              </View>
              <StatusBadge status={activeOrder.status} />
            </View>
            <Text style={styles.heroComplaint} numberOfLines={2}>
              {activeOrder.complaintDescription}
            </Text>
            <View style={styles.heroProgress}>
              <View style={styles.heroProgressHeader}>
                <Text style={styles.heroProgressLabel}>İlerleme</Text>
                <Text style={styles.heroProgressPct}>{activeOrder.completionPercentage ?? 0}%</Text>
              </View>
              <ProgressBar value={activeOrder.completionPercentage ?? 0} height={8} />
            </View>
            {activeOrder.estimatedDelivery && (
              <Text style={styles.heroDelivery}>
                🕐 Tahmini Teslim: {new Date(activeOrder.estimatedDelivery).toLocaleDateString("tr-TR")}
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.ctaCard, Shadow.navy]}
            onPress={() => router.push("/(musteri)/randevu")}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaIcon}>📅</Text>
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Randevu Al</Text>
              <Text style={styles.ctaSubtitle}>Hızlıca servis randevusu oluşturun</Text>
            </View>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions 2x2 Grid */}
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickCard, Shadow.navy]}
              onPress={() => router.push(action.route)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        {recentOrders.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
            {recentOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.txCard, Shadow.navy]}
                onPress={() => router.push(`/(musteri)/gecmis` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.txLeft}>
                  <Text style={styles.txPlate}>{order.vehicle?.plate}</Text>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {order.complaintDescription}
                  </Text>
                  <Text style={styles.txDate}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("tr-TR") : ""}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <StatusBadge status={order.status} size="sm" />
                  {order.totalAmount != null && (
                    <Text style={styles.txAmount}>
                      ₺{Number(order.totalAmount).toLocaleString("tr-TR")}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16, color: Colors.error },
  retryBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  retryText: { color: "#fff", fontWeight: "600" },

  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  bellIcon: { fontSize: 18 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: { fontSize: 11, fontWeight: "600", color: Colors.outline, textTransform: "uppercase", letterSpacing: 0.5 },
  heroPlate: { fontSize: 22, fontWeight: "800", color: Colors.primary, letterSpacing: 2, marginTop: 2 },
  heroVehicle: { fontSize: 13, color: Colors.outline, marginTop: 2 },
  heroComplaint: { fontSize: 14, color: Colors.onSurface, lineHeight: 20 },
  heroProgress: { gap: 6 },
  heroProgressHeader: { flexDirection: "row", justifyContent: "space-between" },
  heroProgressLabel: { fontSize: 12, color: Colors.outline },
  heroProgressPct: { fontSize: 12, fontWeight: "700", color: Colors.primaryContainer },
  heroDelivery: { fontSize: 12, color: Colors.outline },

  // CTA card
  ctaCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 80,
  },
  ctaIcon: { fontSize: 32 },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  ctaSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  ctaArrow: { fontSize: 20, color: "#fff", fontWeight: "700" },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.onSurface, marginTop: 4 },

  // Quick actions
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: "47%",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 18,
    alignItems: "center",
    gap: 8,
    minHeight: 96,
    justifyContent: "center",
  },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: "600", color: Colors.onSurface, textAlign: "center" },

  // Recent transactions
  txCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  txLeft: { flex: 1, gap: 3 },
  txPlate: { fontSize: 14, fontWeight: "700", color: Colors.primary, letterSpacing: 1 },
  txDesc: { fontSize: 12, color: Colors.outline },
  txDate: { fontSize: 11, color: Colors.outline },
  txRight: { alignItems: "flex-end", gap: 6 },
  txAmount: { fontSize: 14, fontWeight: "700", color: Colors.onSurface },
});
