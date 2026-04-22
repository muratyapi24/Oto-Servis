import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GlassHeader } from "@/components/GlassHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface SavedCard {
  id: string;
  type: "visa" | "mastercard";
  maskedNumber: string;
  expiry: string;
}

const INITIAL_CARDS: SavedCard[] = [
  { id: "1", type: "visa", maskedNumber: "**** **** **** 4242", expiry: "12/26" },
  { id: "2", type: "mastercard", maskedNumber: "**** **** **** 8888", expiry: "03/25" },
];

const CARD_ICONS: Record<string, string> = {
  visa: "💳",
  mastercard: "💳",
};

const CARD_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
};

const CARD_COLORS: Record<string, string> = {
  visa: "#1a1f71",
  mastercard: "#eb001b",
};

export default function KartlarScreen() {
  const [cards, setCards] = useState<SavedCard[]>(INITIAL_CARDS);

  function handleDelete(card: SavedCard) {
    Alert.alert(
      "Kartı Sil",
      "Bu kartı silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () =>
            setCards((prev) => prev.filter((c) => c.id !== card.id)),
        },
      ]
    );
  }

  function handleAddCard() {
    Alert.alert("Bilgi", "Kart ekleme özelliği yakında aktif olacak");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Kayıtlı Kartlar" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>Kayıtlı kart yok</Text>
            <Text style={styles.emptySubtitle}>
              Hızlı ödeme için kart ekleyebilirsiniz
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={[styles.cardItem, Shadow.navy]}>
              {/* Card visual strip */}
              <View
                style={[
                  styles.cardStrip,
                  { backgroundColor: CARD_COLORS[card.type] },
                ]}
              />

              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardTypeRow}>
                    <Text style={styles.cardIcon}>{CARD_ICONS[card.type]}</Text>
                    <Text style={styles.cardTypeLabel}>
                      {CARD_LABELS[card.type]}
                    </Text>
                  </View>
                  <Text style={styles.cardNumber}>{card.maskedNumber}</Text>
                  <Text style={styles.cardExpiry}>Son Kullanma: {card.expiry}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(card)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteBtnText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <PrimaryButton
          label="+ Yeni Kart Ekle"
          variant="outline"
          size="lg"
          onPress={handleAddCard}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  cardItem: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 80,
  },
  cardStrip: {
    width: 6,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardLeft: { flex: 1, gap: 4 },
  cardTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardIcon: { fontSize: 18 },
  cardTypeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onSurface,
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  cardExpiry: { fontSize: 12, color: Colors.outline },

  deleteBtn: {
    backgroundColor: "#fef2f2",
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteBtnText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: "700",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
  },
});
