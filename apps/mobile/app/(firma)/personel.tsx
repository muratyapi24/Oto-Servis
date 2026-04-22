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
import { KpiCard } from "@/components/KpiCard";
import { MechanicAvatar } from "@/components/MechanicAvatar";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function PersonelScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-personel"],
    queryFn: () => api.firmaPersonel() as Promise<any>,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const personel: any[] = data?.personel ?? [];
  const summary = data?.summary;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Personel" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Row */}
        {summary && (
          <View style={styles.summaryRow}>
            <KpiCard
              label="Aktif Usta"
              value={String(summary.totalActive ?? 0)}
              icon="👷"
              variant="primary"
            />
            <KpiCard
              label="Açık İş"
              value={String(summary.totalOpenOrders ?? 0)}
              icon="🔧"
              variant="surface"
            />
            <KpiCard
              label="Ort. Yük"
              value={`${summary.avgLoad ?? 0}`}
              icon="📊"
              variant="surface"
            />
          </View>
        )}

        {/* Mechanic Cards */}
        {personel.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Personel bulunamadı</Text>
          </View>
        ) : (
          personel.map((p: any) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, Shadow.navy]}
              onPress={() =>
                router.push(`/(firma)/personel/${p.id}` as any)
              }
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <MechanicAvatar
                  avatarUrl={p.avatarUrl}
                  firstName={p.firstName}
                  lastName={p.lastName}
                  size={48}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {p.firstName} {p.lastName}
                  </Text>
                  {p.phone ? (
                    <Text style={styles.phone}>{p.phone}</Text>
                  ) : null}
                  <Text style={styles.activeOrders}>
                    {p.activeOrderCount ?? 0} aktif iş emri
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor: p.isActive
                        ? Colors.secondary
                        : Colors.outline,
                    },
                  ]}
                />
              </View>

              {p.specialties && p.specialties.length > 0 && (
                <View style={styles.specialties}>
                  {p.specialties.map((s: string) => (
                    <View key={s} style={styles.specialtyChip}>
                      <Text style={styles.specialtyText}>{s}</Text>
                    </View>
                  ))}
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

  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  phone: {
    fontSize: 12,
    color: Colors.outline,
  },
  activeOrders: {
    fontSize: 12,
    color: Colors.primaryContainer,
    fontWeight: "600",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  specialties: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  specialtyChip: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  specialtyText: {
    fontSize: 11,
    color: Colors.primaryContainer,
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontSize: 15,
    color: Colors.outline,
    fontWeight: "500",
  },
});
