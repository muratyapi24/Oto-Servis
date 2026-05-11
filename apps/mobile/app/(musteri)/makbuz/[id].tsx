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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_RECEIPT: any = {
  customerName: "Ahmet Yılmaz",
  customerPhone: "0532 123 45 67",
  amount: 1670,
  paymentMethod: "Kredi Kartı",
  date: "15 Ocak 2025",
  installments: "3 Taksit",
};

export default function MakbuzScreen() {
  if (!__DEV__) return null; // TODO: Connect to real payment API
  const { id } = useLocalSearchParams<{ id: string }>();
  const receipt = MOCK_RECEIPT;
  const receiptNumber = `MKB-${(id ?? "000").toString().slice(-6).toUpperCase()}`;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Makbuz" onBack={() => router.back()} />
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
            <Text style={styles.sectionValue}>{receipt?.customerName}</Text>
            <Text style={styles.sectionSub}>
              Telefon: {receipt?.customerPhone}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>TUTAR</Text>
            <Text style={styles.amountValue}>
              ₺{receipt?.amount.toLocaleString("tr-TR")}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Payment Method */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ödeme Yöntemi</Text>
            <View style={styles.methodBadge}>
              <Text style={styles.methodText}>{receipt?.paymentMethod}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taksit</Text>
            <Text style={styles.infoValue}>{receipt?.installments}</Text>
          </View>

          {/* Date */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tarih</Text>
            <Text style={styles.infoValue}>{receipt?.date}</Text>
          </View>

          <View style={styles.divider} />

          {/* Status */}
          <View style={styles.statusRow}>
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>✓ ÖDENDİ</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.idNote}>Referans No: {id}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={() => Alert.alert("İndir", "Makbuz indiriliyor...")}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnOutlineText}>⬇️ İndir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => Alert.alert("Paylaş", "Makbuz paylaşılıyor...")}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnPrimaryText}>📤 Paylaş</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

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

  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh },

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
  sectionSub: { fontSize: 13, color: Colors.outline },

  amountSection: { alignItems: "center", gap: 4 },
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
    minHeight: 32,
  },
  infoLabel: { fontSize: 13, color: Colors.outline, fontWeight: "500" },
  infoValue: { fontSize: 13, fontWeight: "600", color: Colors.onSurface },

  methodBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.xl,
  },
  methodText: { fontSize: 12, fontWeight: "600", color: Colors.onSurface },

  statusRow: { alignItems: "center" },
  paidBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.xl,
  },
  paidText: { fontSize: 14, fontWeight: "800", color: Colors.secondary, letterSpacing: 1 },

  idNote: {
    fontSize: 11,
    color: Colors.outline,
    textAlign: "center",
    fontFamily: "monospace",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.navy,
  },
  actionBtnOutline: {
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  actionBtnOutlineText: {
    color: Colors.primaryContainer,
    fontSize: 14,
    fontWeight: "700",
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primaryContainer,
  },
  actionBtnPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
