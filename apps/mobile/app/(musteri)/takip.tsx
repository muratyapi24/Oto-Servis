import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GlassHeader } from "@/components/GlassHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Colors, Radius, Shadow } from "@/constants/theme";

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Bekliyor" },
  { key: "IN_PROGRESS", label: "Devam Ediyor" },
  { key: "COMPLETED", label: "Tamamlandı" },
];

function getStepIndex(status: string): number {
  if (status === "COMPLETED" || status === "CANCELLED") return 2;
  if (status === "IN_PROGRESS" || status === "WAITING_APPROVAL") return 1;
  return 0;
}

function TimelineBar({ status }: { status: string }) {
  const activeIdx = getStepIndex(status);
  return (
    <View style={tlStyles.container}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <View key={step.key} style={tlStyles.stepRow}>
            <View style={tlStyles.dotCol}>
              <View
                style={[
                  tlStyles.dot,
                  done && tlStyles.dotDone,
                  active && tlStyles.dotActive,
                ]}
              >
                {done && <Text style={tlStyles.check}>✓</Text>}
              </View>
              {idx < TIMELINE_STEPS.length - 1 && (
                <View style={[tlStyles.line, done && tlStyles.lineDone]} />
              )}
            </View>
            <Text
              style={[
                tlStyles.label,
                active && tlStyles.labelActive,
                done && tlStyles.labelDone,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const tlStyles = StyleSheet.create({
  container: { gap: 0, paddingVertical: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dotCol: { alignItems: "center", width: 20 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
  },
  dotDone: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  dotActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primaryContainer },
  check: { color: "#fff", fontSize: 10, fontWeight: "800" },
  line: { width: 2, height: 20, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 2 },
  lineDone: { backgroundColor: Colors.secondary },
  label: { fontSize: 12, color: Colors.outline, paddingTop: 2 },
  labelActive: { color: Colors.primaryContainer, fontWeight: "700" },
  labelDone: { color: Colors.secondary, fontWeight: "600" },
});

export default function TakipScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["musteri-panel"],
    queryFn: () => api.musteriPanel() as Promise<any>,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.firmaOnayIslem(id, { action: "approve" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musteri-panel"] });
      Alert.alert("Başarılı", "Servis onaylandı.");
    },
    onError: () => Alert.alert("Hata", "İşlem gerçekleştirilemedi."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.firmaOnayIslem(id, { action: "reject" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musteri-panel"] });
      Alert.alert("Bilgi", "Servis reddedildi.");
    },
    onError: () => Alert.alert("Hata", "İşlem gerçekleştirilemedi."),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const activeOrders: any[] = (data?.vehicles ?? []).flatMap((v: any) =>
    (v.serviceOrders ?? [])
      .filter((o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
      .map((o: any) => ({ ...o, vehicle: v }))
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Servis Takip" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeOrders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>Aktif servis yok</Text>
            <Text style={styles.emptySubtitle}>Şu anda serviste aracınız bulunmuyor</Text>
          </View>
        ) : (
          activeOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, Shadow.navy]}
              onPress={() => router.push(`/(musteri)/gecmis` as any)}
              activeOpacity={0.85}
            >
              {/* Header */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderPlate}>{order.vehicle?.plate}</Text>
                  <Text style={styles.orderVehicle}>
                    {order.vehicle?.brand} {order.vehicle?.model}
                  </Text>
                </View>
                <StatusBadge status={order.status} />
              </View>

              <Text style={styles.orderComplaint} numberOfLines={2}>
                {order.complaintDescription}
              </Text>

              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Tamamlanma</Text>
                  <Text style={styles.progressPct}>{order.completionPercentage ?? 0}%</Text>
                </View>
                <ProgressBar value={order.completionPercentage ?? 0} height={6} />
              </View>

              {/* Timeline */}
              <TimelineBar status={order.status} />

              {/* Mechanic */}
              {order.assignedMechanic && (
                <View style={styles.mechanicRow}>
                  <Text style={styles.mechanicIcon}>👨‍🔧</Text>
                  <Text style={styles.mechanicName}>
                    {order.assignedMechanic.firstName} {order.assignedMechanic.lastName}
                  </Text>
                </View>
              )}

              {/* Approval Banner */}
              {order.status === "WAITING_APPROVAL" && (
                <View style={styles.approvalBanner}>
                  <Text style={styles.approvalText}>⚠️ Onayınız bekleniyor</Text>
                  <Text style={styles.approvalSubtext}>
                    Servis devam etmesi için onayınız gerekiyor
                  </Text>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => approveMutation.mutate(order.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Text style={styles.approveBtnText}>Onayla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => rejectMutation.mutate(order.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Text style={styles.rejectBtnText}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
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

  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.onSurface },
  emptySubtitle: { fontSize: 14, color: Colors.outline, textAlign: "center" },

  orderCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderPlate: { fontSize: 18, fontWeight: "800", color: Colors.primary, letterSpacing: 1.5 },
  orderVehicle: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  orderComplaint: { fontSize: 13, color: Colors.onSurface, lineHeight: 18 },

  progressSection: { gap: 6 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 12, color: Colors.outline },
  progressPct: { fontSize: 12, fontWeight: "700", color: Colors.primaryContainer },

  mechanicRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mechanicIcon: { fontSize: 14 },
  mechanicName: { fontSize: 13, color: Colors.outline },

  approvalBanner: {
    backgroundColor: "#fff7ed",
    borderRadius: Radius.md,
    padding: 14,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f97316",
  },
  approvalText: { fontSize: 14, fontWeight: "700", color: "#c2410c" },
  approvalSubtext: { fontSize: 12, color: "#9a3412" },
  approvalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  approveBtn: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  approveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  rejectBtnText: { color: Colors.error, fontWeight: "700", fontSize: 14 },
});
