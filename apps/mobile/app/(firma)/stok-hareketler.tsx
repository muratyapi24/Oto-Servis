import React, { useState } from "react";
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
import { Colors, Radius, Shadow } from "@/constants/theme";

const LIMIT = 20;

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; sign: string; bg: string }
> = {
  IN: { label: "Giriş", color: Colors.secondary, sign: "+", bg: "#f0fdf4" },
  OUT: { label: "Çıkış", color: Colors.error, sign: "-", bg: "#fef2f2" },
  ADJUST: { label: "Düzeltme", color: "#b45309", sign: "±", bg: "#fffbeb" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StokHareketlerScreen() {
  const [page, setPage] = useState(1);
  const [allMovements, setAllMovements] = useState<any[]>([]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-stok-hareketler", page],
    queryFn: async () => {
      const result = (await api.firmaStokHareketler({
        page,
        limit: LIMIT,
      })) as any;
      if (page === 1) {
        setAllMovements(result.movements ?? []);
      } else {
        setAllMovements((prev) => [...prev, ...(result.movements ?? [])]);
      }
      return result;
    },
  });

  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages;

  const handleRefresh = () => {
    setPage(1);
    setAllMovements([]);
    refetch();
  };

  const handleLoadMore = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Stok Hareketleri" onBack={() => router.back()} />
      {isLoading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && page === 1}
              onRefresh={handleRefresh}
            />
          }
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary row */}
          {data && (
            <View style={[styles.summaryCard, Shadow.navy]}>
              <Text style={styles.summaryText}>
                Toplam{" "}
                <Text style={styles.summaryBold}>{data.total ?? 0}</Text>{" "}
                hareket
              </Text>
            </View>
          )}

          {allMovements.length === 0 ? (
            <View style={[styles.emptyCard, Shadow.navy]}>
              <Text style={styles.emptyText}>Stok hareketi bulunamadı</Text>
            </View>
          ) : (
            allMovements.map((mov: any) => {
              const cfg = TYPE_CONFIG[mov.type] ?? TYPE_CONFIG.ADJUST;
              return (
                <View key={mov.id} style={[styles.card, Shadow.navy]}>
                  {/* Type badge */}
                  <View
                    style={[styles.typeBadge, { backgroundColor: cfg.bg }]}
                  >
                    <Text style={[styles.typeSign, { color: cfg.color }]}>
                      {cfg.sign}
                    </Text>
                    <Text style={[styles.typeLabel, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.cardBody}>
                    <Text style={styles.partName} numberOfLines={1}>
                      {mov.part?.name ?? "—"}
                    </Text>
                    {mov.part?.partNumber ? (
                      <Text style={styles.partNumber}>
                        {mov.part.partNumber}
                      </Text>
                    ) : null}
                    {mov.reason ? (
                      <Text style={styles.reason} numberOfLines={1}>
                        {mov.reason}
                      </Text>
                    ) : null}
                    <Text style={styles.date}>{formatDate(mov.createdAt)}</Text>
                  </View>

                  {/* Quantity */}
                  <Text style={[styles.qty, { color: cfg.color }]}>
                    {cfg.sign}
                    {mov.quantity}
                  </Text>
                </View>
              );
            })
          )}

          {/* Load more */}
          {hasMore && (
            <TouchableOpacity
              style={[styles.loadMoreBtn, Shadow.navy]}
              onPress={handleLoadMore}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading && page > 1 ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.primaryContainer}
                />
              ) : (
                <Text style={styles.loadMoreText}>Daha Fazla Yükle</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 10, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: "center",
  },
  summaryText: { fontSize: 13, color: Colors.outline },
  summaryBold: {
    fontWeight: "700",
    color: Colors.onSurface,
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
  },
  typeBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 52,
    gap: 1,
  },
  typeSign: { fontSize: 16, fontWeight: "800" },
  typeLabel: { fontSize: 10, fontWeight: "600" },

  cardBody: { flex: 1, gap: 2 },
  partName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  partNumber: { fontSize: 11, color: Colors.outline },
  reason: { fontSize: 12, color: Colors.outline },
  date: { fontSize: 11, color: Colors.outline, marginTop: 2 },

  qty: {
    fontSize: 18,
    fontWeight: "800",
    minWidth: 40,
    textAlign: "right",
  },

  loadMoreBtn: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryContainer,
  },

  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: Colors.outline },
});
