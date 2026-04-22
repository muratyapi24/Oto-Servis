import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  category: string;
}

const MOCK_SERVICES: Service[] = [
  {
    id: "1",
    name: "Yağ Değişimi",
    price: 850,
    duration: 30,
    category: "Bakım",
  },
  {
    id: "2",
    name: "Fren Bakımı",
    price: 1200,
    duration: 60,
    category: "Fren Sistemi",
  },
  {
    id: "3",
    name: "Lastik Rotasyonu",
    price: 400,
    duration: 45,
    category: "Lastik",
  },
  {
    id: "4",
    name: "Akü Değişimi",
    price: 2500,
    duration: 20,
    category: "Elektrik",
  },
  {
    id: "5",
    name: "Hava Filtresi Değişimi",
    price: 350,
    duration: 15,
    category: "Bakım",
  },
  {
    id: "6",
    name: "Triger Seti Değişimi",
    price: 4500,
    duration: 180,
    category: "Motor",
  },
  {
    id: "7",
    name: "Klima Bakımı",
    price: 750,
    duration: 60,
    category: "Klima",
  },
  {
    id: "8",
    name: "Genel Bakım Paketi",
    price: 1800,
    duration: 120,
    category: "Bakım",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Bakım": Colors.secondary,
  "Fren Sistemi": Colors.error,
  "Lastik": "#f59e0b",
  "Elektrik": "#8b5cf6",
  "Motor": Colors.primaryContainer,
  "Klima": "#06b6d4",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
}

export default function HizmetlerScreen() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_SERVICES;
    return MOCK_SERVICES.filter((s) => s.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Hizmet Kataloğu" onBack={() => router.back()} />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Hizmet ara..."
            placeholderTextColor={Colors.outline}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
            <Text style={styles.emptyBody}>
              "{search}" için eşleşen hizmet yok.
            </Text>
          </View>
        ) : (
          filtered.map((service) => {
            const catColor = CATEGORY_COLORS[service.category] ?? Colors.outline;
            return (
              <View key={service.id} style={[styles.card, Shadow.navy]}>
                <View style={[styles.categoryBar, { backgroundColor: catColor }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePrice}>
                      ₺{service.price.toLocaleString("tr-TR")}
                    </Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor + "22" }]}>
                      <Text style={[styles.categoryText, { color: catColor }]}>
                        {service.category}
                      </Text>
                    </View>
                    <Text style={styles.duration}>⏱ {formatDuration(service.duration)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    ...Shadow.navy,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
  },

  scroll: { padding: 16, gap: 10, paddingBottom: 32 },

  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 10,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    flexDirection: "row",
    overflow: "hidden",
  },
  categoryBar: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primaryContainer,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  duration: {
    fontSize: 12,
    color: Colors.outline,
  },
});
