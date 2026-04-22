import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface ApprovalOrder {
  id: string;
  vehicle?: { plate?: string };
  totalAmount?: number;
  isUrgent?: boolean;
  complaintDescription?: string;
}

export default function OnayScreen() {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-onay"],
    queryFn: () => api.firmaOnayListesi() as Promise<any>,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.firmaOnayIslem(id, { action: "approve" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["firma-onay"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.firmaOnayIslem(id, { action: "reject", reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["firma-onay"] });
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  function handleApprove(id: string) {
    approveMutation.mutate(id);
  }

  function openRejectModal(id: string) {
    setRejectTarget(id);
    setRejectReason("");
  }

  function handleRejectSubmit() {
    if (!rejectTarget) return;
    rejectMutation.mutate({ id: rejectTarget, reason: rejectReason });
  }

  const orders: ApprovalOrder[] = data?.orders ?? [];
  const fmt = (v: number) => `₺${(v ?? 0).toLocaleString("tr-TR")}`;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Onay Merkezi" />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>Bekleyen onay yok</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={[styles.card, Shadow.navy]}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <Text style={styles.plate}>
                    {order.vehicle?.plate ?? "—"}
                  </Text>
                  {order.isUrgent ? (
                    <View style={styles.acilBadge}>
                      <Text style={styles.acilText}>ACİL</Text>
                    </View>
                  ) : null}
                </View>

                {/* Amount */}
                <Text style={styles.amount}>
                  {fmt(order.totalAmount ?? 0)}
                </Text>

                {/* Complaint */}
                {order.complaintDescription ? (
                  <Text style={styles.complaint} numberOfLines={2}>
                    {order.complaintDescription}
                  </Text>
                ) : null}

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.approveBtn,
                      approveMutation.isPending && styles.btnDisabled,
                    ]}
                    onPress={() => handleApprove(order.id)}
                    disabled={approveMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.approveBtnText}>Onayla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => openRejectModal(order.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rejectBtnText}>Reddet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Reject Modal */}
      <Modal
        visible={!!rejectTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Red Gerekçesi</Text>
            <TextInput
              style={styles.modalInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Red gerekçesini yazın..."
              placeholderTextColor={Colors.outline}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setRejectTarget(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalRejectBtn,
                  rejectMutation.isPending && styles.btnDisabled,
                ]}
                onPress={handleRejectSubmit}
                disabled={rejectMutation.isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.modalRejectText}>Reddet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontSize: 15,
    color: Colors.outline,
    fontWeight: "500",
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plate: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  acilBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  acilText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  amount: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.primaryContainer,
  },
  complaint: {
    fontSize: 13,
    color: Colors.outline,
    lineHeight: 18,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  approveBtn: {
    backgroundColor: Colors.secondary,
  },
  approveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: Colors.error,
  },
  rejectBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 24,
    width: "100%",
    gap: 16,
    ...Shadow.navy,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  modalInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.onSurface,
    minHeight: 100,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelBtn: {
    backgroundColor: Colors.surfaceContainer,
  },
  modalCancelText: {
    color: Colors.onSurface,
    fontWeight: "600",
    fontSize: 14,
  },
  modalRejectBtn: {
    backgroundColor: Colors.error,
  },
  modalRejectText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
