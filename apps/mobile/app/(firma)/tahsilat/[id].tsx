import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function TahsilatDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const receiptNumber = `THS-${(id ?? "000").toString().slice(-6).toUpperCase()}`;
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleShare = () => {
    Alert.alert("Paylaş", "Makbuz paylaşılıyor...");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Tahsilat Detayı" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Card */}
        <View style={[styles.receiptCard, Shadow.navy]}>
          {/* Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>MAKBUZ</Text>
            <Text style={styles.receiptNumber}>{receiptNumber}</Text>
          </View>

          <View style={styles.divider} />

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MÜŞTERİ BİLGİLERİ</Text>
            <Text style={styles.sectionValue}>Müşteri Adı Soyadı</Text>
            <Text style={styles.sectionSub}>Telefon: —</Text>
          </View>

          <View style={styles.divider} />

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>TUTAR</Text>
            <Text style={styles.amountValue}>₺0,00</Text>
          </View>

          <View style={styles.divider} />

          {/* Payment Method */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ödeme Yöntemi</Text>
            <View style={styles.methodBadge}>
              <Text style={styles.methodText}>Nakit</Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tarih</Text>
            <Text style={styles.infoValue}>{today}</Text>
          </View>

          {/* Status */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Durum</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>✓ ÖDENDİ</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ID Note */}
          <Text style={styles.idNote}>Referans No: {id}</Text>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Text style={styles.shareBtnText}>📤 Paylaş</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },

  receiptCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 16,
  },
  receiptHeader: {
    alignItems: "center",
    gap: 4,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.primaryContainer,
    letterSpacing: 4,
  },
  receiptNumber: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "600",
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
  },

  section: { gap: 4 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.outline,
  },

  amountSection: {
    alignItems: "center",
    gap: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: 40,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: -1,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  methodBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  methodText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  paidBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  paidText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.secondary,
  },

  idNote: {
    fontSize: 11,
    color: Colors.outline,
    textAlign: "center",
    fontFamily: "monospace",
  },

  shareBtn: {
    height: 52,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.navy,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
