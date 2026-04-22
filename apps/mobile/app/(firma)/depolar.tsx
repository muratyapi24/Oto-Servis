import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function DepolarScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-depolar"],
    queryFn: () => api.firmaDepolar() as Promise<{ locations: any[] }>,
  });

  const locations = data?.locations ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader
        title="Depolar"
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
          {locations.length === 0 ? (
            <View style={[styles.emptyCard, Shadow.navy]}>
              <Text style={styles.emptyIcon}>🏭</Text>
              <Text style={styles.emptyTitle}>Depo bulunamadı</Text>
              <Text style={styles.emptyText}>
                Henüz aktif depo kaydı yok.
              </Text>
            </View>
          ) : (
            locations.map((loc: any) => (
              <TouchableOpacity
                key={loc.id}
                style={[styles.card, Shadow.navy]}
                onPress={() =>
                  router.push(`/(firma)/depo/${loc.id}` as any)
                }
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardIcon}>🏭</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{loc.name}</Text>
                  {(loc.city || loc.address) ? (
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {[loc.city, loc.address].filter(Boolean).join(" • ")}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{loc.partCount}</Text>
                  </View>
                  <Text style={styles.countLabel}>kalem</Text>
                </View>
              </TouchableOpacity>
            ))
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

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: { fontSize: 22 },
  cardBody: { flex: 1, gap: 3 },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.outline,
  },
  cardRight: { alignItems: "center", gap: 2 },
  countBadge: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: "center",
  },
  countText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  countLabel: {
    fontSize: 11,
    color: Colors.outline,
  },

  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 40,
    alignItems: "center",
    gap: 8,
    marginTop: 40,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
  },
});
