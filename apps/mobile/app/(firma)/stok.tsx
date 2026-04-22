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
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { useStockSSE, useInventorySSEStore } from "@/lib/useStockSSE";

const MOVEMENT_COLORS: Record<string, string> = {
  IN: Colors.secondary,
  OUT: Colors.error,
  ADJUST: "#b45309",
};

const MOVEMENT_LABELS: Record<string, string> = {
  IN: "Giriş",
  OUT: "Çıkış",
  ADJUST: "Düzeltme",
};

export default function StokScreen() {
  // SSE bağlantısını başlat — STOCK_UPDATED event'lerini dinler ve ['firma-stok'] key'ini invalidate eder
  useStockSSE();

  const { isConnected, lastUpdatedAt } = useInventorySSEStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-stok"],
    queryFn: () => api.firmaStok() as Promise<any>,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const { criticalParts = [], recentMovements = [] } = data ?? {};

  const dt = (d: string) =>
    new Date(d).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    });

  const formatLastUpdated = (ts: number | null): string => {
    if (!ts) return "";
    const diff = Date.now() - ts;
    if (diff < 60_000) return "Az önce";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`;
    return new Date(ts).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Stok & Envanter" />

      {/* Bağlantı Durumu Göstergesi */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, isConnected ? styles.dotOnline : styles.dotOffline]} />
        <Text style={styles.statusText}>
          {isConnected ? "Canlı" : "Çevrimdışı"}
        </Text>
        {lastUpdatedAt && (
          <Text style={styles.statusSub}>
            {isConnected
              ? `· Son güncelleme: ${formatLastUpdated(lastUpdatedAt)}`
              : `· Son senkronizasyon: ${formatLastUpdated(lastUpdatedAt)}`}
          </Text>
        )}
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Critical Stock Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ⚠️ Kritik Stok{" "}
            {criticalParts.length > 0 ? `(${criticalParts.length})` : ""}
          </Text>
          {criticalParts.length === 0 ? (
            <View style={[styles.emptyCard, Shadow.navy]}>
              <Text style={styles.emptyText}>
                Kritik seviyede parça bulunmuyor
              </Text>
            </View>
          ) : (
            criticalParts.map((part: any) => (
              <View
                key={part.id}
                style={[styles.criticalCard, Shadow.navy]}
              >
                <View style={styles.criticalInfo}>
                  <Text style={styles.partName}>{part.name}</Text>
                  <Text style={styles.partSub}>
                    {part.partNumber
                      ? `${part.partNumber} • `
                      : ""}
                    {part.category?.name ?? "Kategori yok"}
                  </Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockBadgeText}>
                    {part.currentStock}
                  </Text>
                  <Text style={styles.stockBadgeMin}>
                    / {part.minStockLevel}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Movements */}
        {recentMovements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Son Hareketler</Text>
            {recentMovements.map((mov: any) => {
              const color =
                MOVEMENT_COLORS[mov.type] ?? Colors.outline;
              const label =
                MOVEMENT_LABELS[mov.type] ?? mov.type;
              const sign =
                mov.type === "IN"
                  ? "+"
                  : mov.type === "OUT"
                  ? "-"
                  : "±";
              return (
                <View key={mov.id} style={[styles.movementCard, Shadow.navy]}>
                  <View
                    style={[styles.movementDot, { backgroundColor: color }]}
                  />
                  <View style={styles.movementInfo}>
                    <Text style={styles.movementPart}>
                      {mov.part?.name ?? "—"}
                    </Text>
                    <Text style={styles.movementReason}>
                      {mov.reason ?? label}
                    </Text>
                  </View>
                  <View style={styles.movementRight}>
                    <Text style={[styles.movementQty, { color }]}>
                      {sign}
                      {mov.quantity}
                    </Text>
                    <Text style={styles.movementDate}>
                      {dt(mov.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Barcode Scan Button */}
        <PrimaryButton
          label="Barkod Tara"
          onPress={() => router.push("/(firma)/barkod" as any)}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  section: { gap: 10 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },

  criticalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  criticalInfo: { flex: 1, gap: 3 },
  partName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  partSub: {
    fontSize: 12,
    color: Colors.outline,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  stockBadgeText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.error,
  },
  stockBadgeMin: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "600",
  },

  movementCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  movementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  movementInfo: { flex: 1, gap: 2 },
  movementPart: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  movementReason: {
    fontSize: 12,
    color: Colors.outline,
  },
  movementRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  movementQty: {
    fontSize: 16,
    fontWeight: "800",
  },
  movementDate: {
    fontSize: 11,
    color: Colors.outline,
  },

  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.outline,
    fontWeight: "500",
  },

  // Bağlantı durumu göstergesi
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outline + "33",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: Colors.secondary,
  },
  dotOffline: {
    backgroundColor: "#b45309",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  statusSub: {
    fontSize: 12,
    color: Colors.outline,
  },
});
