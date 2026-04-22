import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { MechanicAvatar } from "@/components/MechanicAvatar";
import { ProgressBar } from "@/components/ProgressBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function ServisDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["firma-servis", id],
    queryFn: () => api.firmaServisDetay(id) as Promise<any>,
    enabled: !!id,
  });

  const order = data?.order;

  // Build checklist from inspectionForms[0].formData
  const rawFormData = order?.inspectionForms?.[0]?.formData;
  const checklistKeys: string[] = rawFormData
    ? Object.keys(rawFormData)
    : [];

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Reset checked state when order loads
  useEffect(() => {
    if (checklistKeys.length > 0) {
      const initial: Record<string, boolean> = {};
      checklistKeys.forEach((k) => {
        initial[k] = rawFormData[k] === true || rawFormData[k] === "true";
      });
      setChecked(initial);
    }
  }, [order?.id]);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = checklistKeys.length;
  const completionPercentage =
    totalCount > 0 ? Math.floor((checkedCount / totalCount) * 100) : 0;

  function toggleItem(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Servis Detayı" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Kayıt bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const vehicle = order.vehicle ?? {};
  const customer = order.customer ?? {};
  const mechanic = order.assignedMechanic;
  const plate = vehicle.plate ?? "—";
  const brandModel = `${vehicle.brand ?? ""} ${vehicle.model ?? ""}`.trim() || "—";
  const year = vehicle.year ? String(vehicle.year) : null;
  const customerName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—";
  const customerPhone = customer.phone ?? "—";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Servis Detayı" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Hero */}
        <View style={[styles.heroCard, Shadow.navy]}>
          <View style={styles.heroTop}>
            <Text style={styles.plate}>{plate}</Text>
            {order.status ? <StatusBadge status={order.status} size="sm" /> : null}
          </View>
          <Text style={styles.brandModel}>{brandModel}</Text>
          {year ? <Text style={styles.year}>{year}</Text> : null}
          {order.complaintDescription ? (
            <View style={styles.complaintBox}>
              <Text style={styles.complaintLabel}>Şikayet</Text>
              <Text style={styles.complaintText}>{order.complaintDescription}</Text>
            </View>
          ) : null}
        </View>

        {/* Customer Info */}
        <View style={[styles.infoCard, Shadow.navy]}>
          <Text style={styles.cardTitle}>Müşteri Bilgisi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoText}>{customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoText}>{customerPhone}</Text>
          </View>
        </View>

        {/* Assigned Mechanic */}
        {mechanic ? (
          <View style={[styles.infoCard, Shadow.navy]}>
            <Text style={styles.cardTitle}>Atanan Usta</Text>
            <View style={styles.mechanicRow}>
              <MechanicAvatar
                avatarUrl={mechanic.avatarUrl}
                firstName={mechanic.firstName}
                lastName={mechanic.lastName}
                size={44}
              />
              <Text style={styles.mechanicName}>
                {mechanic.firstName} {mechanic.lastName}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Progress */}
        <View style={[styles.infoCard, Shadow.navy]}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Tamamlanma</Text>
            <Text style={styles.progressPct}>{completionPercentage}%</Text>
          </View>
          <ProgressBar value={completionPercentage} animated />
        </View>

        {/* Inspection Checklist */}
        <View style={[styles.infoCard, Shadow.navy]}>
          <Text style={styles.cardTitle}>Kontrol Listesi</Text>
          {checklistKeys.length === 0 ? (
            <Text style={styles.emptyChecklist}>Kontrol listesi bulunamadı</Text>
          ) : (
            checklistKeys.map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.checkItem}
                onPress={() => toggleItem(key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    checked[key] && styles.checkboxChecked,
                  ]}
                >
                  {checked[key] ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.checkLabel,
                    checked[key] && styles.checkLabelDone,
                  ]}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            label="İşi Kapat"
            onPress={() => router.push(`/(firma)/is-kapat/${id}` as any)}
            size="lg"
          />
          <PrimaryButton
            label="Parça Talep Et"
            onPress={() => router.push("/(firma)/parca-talep" as any)}
            size="lg"
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 15, color: Colors.outline },

  heroCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 6,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  plate: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  brandModel: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  year: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  complaintBox: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radius.md,
    padding: 12,
    gap: 4,
  },
  complaintLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  complaintText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },

  infoCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 32,
  },
  infoIcon: { fontSize: 16 },
  infoText: {
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: "500",
  },

  mechanicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
  },
  mechanicName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onSurface,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPct: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.secondary,
  },

  emptyChecklist: {
    fontSize: 14,
    color: Colors.outline,
    textAlign: "center",
    paddingVertical: 12,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
  },
  checkLabelDone: {
    color: Colors.outline,
    textDecorationLine: "line-through",
  },

  actions: {
    gap: 10,
    marginTop: 4,
  },
});
