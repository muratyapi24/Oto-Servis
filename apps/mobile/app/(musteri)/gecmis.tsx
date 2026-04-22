import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GlassHeader } from "@/components/GlassHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function GecmisScreen() {
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["musteri-panel"],
    queryFn: () => api.musteriPanel() as Promise<any>,
  });

  const allOrders = useMemo(() => {
    if (!data?.vehicles) return [];
    return (data.vehicles as any[]).flatMap((v: any) =>
      (v.serviceOrders ?? []).map((o: any) => ({
        ...o,
        vehicle: v,
      }))
    );
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOrders;
    return allOrders.filter(
      (o: any) =>
        o.vehicle?.plate?.toLowerCase().includes(q) ||
        o.complaintDescription?.toLowerCase().includes(q) ||
        `${o.vehicle?.brand} ${o.vehicle?.model}`.toLowerCase().includes(q)
    );
  }, [allOrders, search]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Servis Geçmişi" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Plaka veya servis türü ara..."
            placeholderTextColor={Colors.outline}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{search ? "🔍" : "📋"}</Text>
            <Text style={styles.emptyTitle}>
              {search ? "Sonuç bulunamadı" : "Servis geçmişi yok"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? `"${search}" için kayıt bulunamadı`
                : "Tamamlanan servisleriniz burada görünecek"}
            </Text>
          </View>
        ) : (
          filtered.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              style={[styles.card, Shadow.navy]}
              onPress={() => router.push(`/(musteri)/gecmis` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardPlate}>{order.vehicle?.plate}</Text>
                  <Text style={styles.cardVehicle}>
                    {order.vehicle?.brand} {order.vehicle?.model}
                  </Text>
                </View>
                <StatusBadge status={order.status} size="sm" />
              </View>

              <Text style={styles.cardComplaint} numberOfLines={2}>
                {order.complaintDescription}
              </Text>

              <View style={styles.cardBottom}>
                <Text style={styles.cardDate}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </Text>
                {order.totalAmount != null && (
                  <Text style={styles.cardAmount}>
                    ₺{Number(order.totalAmount).toLocaleString("tr-TR")}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 0,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    height: 48,
  },

  scroll: { padding: 16, gap: 12, paddingBottom: 32 },

  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.onSurface },
  emptySubtitle: { fontSize: 14, color: Colors.outline, textAlign: "center" },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeft: { gap: 2 },
  cardPlate: { fontSize: 16, fontWeight: "800", color: Colors.primary, letterSpacing: 1.5 },
  cardVehicle: { fontSize: 12, color: Colors.outline },
  cardComplaint: { fontSize: 13, color: Colors.onSurface, lineHeight: 18 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 0,
  },
  cardDate: { fontSize: 12, color: Colors.outline },
  cardAmount: { fontSize: 15, fontWeight: "700", color: Colors.onSurface },
});
