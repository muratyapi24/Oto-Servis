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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function DepoDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-depo", id],
    queryFn: () =>
      api.firmaDepoDetay(id) as Promise<{ location: any; parts: any[] }>,
    enabled: !!id,
  });

  const location = data?.location;
  const parts = data?.parts ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader
        title={location?.name ?? "Depo Detayı"}
        subtitle={location?.city ?? undefined}
        onBack={() => router.back()}
      />
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
          {/* Summary row */}
          <View style={[styles.summaryCard, Shadow.navy]}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{parts.length}</Text>
              <Text style={styles.summaryLabel}>Toplam Parça</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>
                {parts.filter((p) => p.currentStock <= p.minStockLevel).length}
              </Text>
              <Text style={styles.summaryLabel}>Kritik Stok</Text>
            </View>
          </View>

          {/* Parts list */}
          <Text style={styles.sectionTitle}>Parçalar</Text>
          {parts.length === 0 ? (
            <View style={[styles.emptyCard, Shadow.navy]}>
              <Text style={styles.emptyText}>Bu depoda parça bulunmuyor</Text>
            </View>
          ) : (
            parts.map((part: any) => {
              const isCritical = part.currentStock <= part.minStockLevel;
              return (
                <View
                  key={part.id}
                  style={[
                    styles.partCard,
                    Shadow.navy,
                    isCritical && styles.partCardCritical,
                  ]}
                >
                  <View style={styles.partInfo}>
                    <Text style={styles.partName}>{part.name}</Text>
                    <Text style={styles.partSub}>
                      {part.partNumber ? `${part.partNumber}` : ""}
                      {part.partNumber && part.category?.name ? " • " : ""}
                      {part.category?.name ?? ""}
                    </Text>
                  </View>
                  <View style={styles.partStock}>
                    <Text
                      style={[
                        styles.stockCurrent,
                        isCritical && { color: Colors.error },
                      ]}
                    >
                      {part.currentStock}
                    </Text>
                    <Text style={styles.stockMin}>/ {part.minStockLevel}</Text>
                    {isCritical && (
                      <View style={styles.warningBadge}>
                        <Text style={styles.warningText}>⚠️ Kritik</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.primaryContainer,
  },
  summaryLabel: { fontSize: 12, color: Colors.outline },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.outlineVariant,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: 4,
  },

  partCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
  },
  partCardCritical: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  partInfo: { flex: 1, gap: 3 },
  partName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  partSub: { fontSize: 12, color: Colors.outline },
  partStock: { alignItems: "flex-end", gap: 3 },
  stockCurrent: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryContainer,
  },
  stockMin: { fontSize: 12, color: Colors.outline },
  warningBadge: {
    backgroundColor: "#fef2f2",
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  warningText: { fontSize: 11, color: Colors.error, fontWeight: "600" },

  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: Colors.outline },
});
