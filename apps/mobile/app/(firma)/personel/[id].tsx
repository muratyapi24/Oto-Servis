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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { KpiCard } from "@/components/KpiCard";
import { MechanicAvatar } from "@/components/MechanicAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function PersonelDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-personel-detay", id],
    queryFn: () => api.firmaPersonelDetay(id) as Promise<any>,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Personel Detayı" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      </SafeAreaView>
    );
  }

  const mechanic = data?.mechanic ?? data;
  const activeOrders: any[] = data?.activeOrders ?? [];
  const performance = data?.performance ?? {};

  if (!mechanic) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Personel Detayı" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Personel bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = `${mechanic.firstName ?? ""} ${mechanic.lastName ?? ""}`.trim();
  const isActive = mechanic.isActive ?? true;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Personel Detayı" onBack={() => router.back()} />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroCard, Shadow.navy]}>
          <View style={styles.heroAvatarRow}>
            <MechanicAvatar
              avatarUrl={mechanic.avatarUrl}
              firstName={mechanic.firstName ?? "?"}
              lastName={mechanic.lastName ?? "?"}
              size={80}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{fullName}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? Colors.secondary : Colors.outline },
                  ]}
                />
                <Text
                  style={[
                    styles.statusLabel,
                    { color: isActive ? Colors.secondary : Colors.outline },
                  ]}
                >
                  {isActive ? "Aktif" : "Pasif"}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.contactRow}>
            {mechanic.phone ? (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>{mechanic.phone}</Text>
              </View>
            ) : null}
            {mechanic.email ? (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>✉️</Text>
                <Text style={styles.contactText} numberOfLines={1}>
                  {mechanic.email}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Specialties */}
          {mechanic.specialties && mechanic.specialties.length > 0 && (
            <View style={styles.specialties}>
              {mechanic.specialties.map((s: string) => (
                <View key={s} style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Performance Summary */}
        <Text style={styles.sectionTitle}>Performans Özeti</Text>
        <View style={styles.kpiRow}>
          <KpiCard
            label="Tamamlanan İş"
            value={String(performance.completedCount ?? mechanic.completedOrderCount ?? 0)}
            icon="✅"
            variant="success"
          />
          <KpiCard
            label="Aktif İş"
            value={String(performance.activeCount ?? mechanic.activeOrderCount ?? 0)}
            icon="🔧"
            variant="primary"
          />
          <KpiCard
            label="Ort. Süre"
            value={formatDuration(performance.avgDurationMinutes)}
            icon="⏱️"
            variant="surface"
          />
        </View>

        {/* Active Orders */}
        <Text style={styles.sectionTitle}>Aktif İş Emirleri</Text>
        {activeOrders.length === 0 ? (
          <View style={[styles.emptyCard, Shadow.navy]}>
            <Text style={styles.emptyText}>Aktif iş emri yok</Text>
          </View>
        ) : (
          activeOrders.map((order: any) => (
            <View key={order.id} style={[styles.orderCard, Shadow.navy]}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderPlate}>{order.plate ?? order.vehicle?.plate ?? "—"}</Text>
                <StatusBadge status={order.status} size="sm" />
              </View>
              <Text style={styles.orderModel} numberOfLines={1}>
                {order.vehicleModel ?? order.vehicle?.model ?? "—"}
              </Text>
              <Text style={styles.orderComplaint} numberOfLines={2}>
                {order.complaintDescription ?? order.complaint ?? "—"}
              </Text>
            </View>
          ))
        )}

        {/* Performans Raporu Button */}
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label="Performans Raporu"
            onPress={() =>
              router.push({
                pathname: "/(firma)/personel-performans" as any,
                params: { id },
              })
            }
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}s ${m}dk` : `${h} saat`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  heroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 14,
  },
  heroAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
  },

  contactRow: {
    gap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 28,
  },
  contactIcon: { fontSize: 14 },
  contactText: {
    fontSize: 13,
    color: Colors.onSurface,
    flex: 1,
  },

  specialties: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  specialtyChip: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.xl,
  },
  specialtyText: {
    fontSize: 11,
    color: Colors.primaryContainer,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: -4,
  },

  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },

  orderCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    gap: 6,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderPlate: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  orderModel: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "500",
  },
  orderComplaint: {
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 18,
  },

  buttonWrapper: {
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.outline,
  },
});
