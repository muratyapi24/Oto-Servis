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
import { SegmentedControl } from "@/components/SegmentedControl";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

const MOCK_INVOICE = {
  number: "FTR-2026-00142",
  date: "15 Ocak 2025",
  items: [
    { name: "Yağ Değişimi (5W-40)", qty: 1, price: 850 },
    { name: "Hava Filtresi", qty: 1, price: 320 },
    { name: "İşçilik Ücreti", qty: 2, price: 250 },
  ],
};

const PAYMENT_METHODS = [
  { label: "Kredi Kartı", value: "kk" },
  { label: "Nakit", value: "nakit" },
  { label: "Havale", value: "havale" },
];

function calcTotals(items: typeof MOCK_INVOICE.items) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const kdv = Math.round(subtotal * 0.2);
  return { subtotal, kdv, total: subtotal + kdv };
}

export default function OdemeScreen() {
  const [paymentMethod, setPaymentMethod] = useState("kk");
  const { subtotal, kdv, total } = calcTotals(MOCK_INVOICE.items);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Ödeme" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Hero */}
        <View style={[styles.totalHero, Shadow.navy]}>
          <Text style={styles.totalLabel}>ÖDENECEK TUTAR</Text>
          <Text style={styles.totalAmount}>
            ₺{total.toLocaleString("tr-TR")}
          </Text>
          <Text style={styles.invoiceRef}>{MOCK_INVOICE.number}</Text>
        </View>

        {/* Invoice Details */}
        <View style={[styles.card, Shadow.navy]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Fatura Detayı</Text>
            <Text style={styles.invoiceDate}>{MOCK_INVOICE.date}</Text>
          </View>

          {MOCK_INVOICE.items.map((item, i) => (
            <View key={i} style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.lineItemName}>{item.name}</Text>
                <Text style={styles.lineItemQty}>x{item.qty}</Text>
              </View>
              <Text style={styles.lineItemPrice}>
                ₺{(item.qty * item.price).toLocaleString("tr-TR")}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ara Toplam</Text>
            <Text style={styles.summaryValue}>
              ₺{subtotal.toLocaleString("tr-TR")}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>KDV (%20)</Text>
            <Text style={styles.summaryValue}>
              ₺{kdv.toLocaleString("tr-TR")}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Toplam</Text>
            <Text style={styles.totalRowValue}>
              ₺{total.toLocaleString("tr-TR")}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.cardTitle}>Ödeme Yöntemi</Text>
          <SegmentedControl
            options={PAYMENT_METHODS}
            selected={paymentMethod}
            onChange={setPaymentMethod}
          />

          {paymentMethod === "kk" && (
            <TouchableOpacity
              style={styles.taksitLink}
              onPress={() => router.push("/(musteri)/odeme-taksit")}
              activeOpacity={0.7}
            >
              <Text style={styles.taksitLinkText}>
                📋 Taksit Seçenekleri →
              </Text>
            </TouchableOpacity>
          )}

          {paymentMethod === "havale" && (
            <View style={styles.havaleInfo}>
              <Text style={styles.havaleTitle}>Havale Bilgileri</Text>
              <Text style={styles.havaleText}>Banka: MS Oto Servis A.Ş.</Text>
              <Text style={styles.havaleText}>IBAN: TR00 0000 0000 0000 0000 0000 00</Text>
              <Text style={styles.havaleText}>
                Açıklama: {MOCK_INVOICE.number}
              </Text>
            </View>
          )}
        </View>

        <PrimaryButton
          label="Ödemeyi Tamamla"
          size="lg"
          onPress={() =>
            Alert.alert(
              "Ödeme",
              "Ödeme işlemi başlatılıyor...",
              [{ text: "Tamam" }]
            )
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  totalHero: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.5,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  invoiceRef: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  invoiceDate: {
    fontSize: 12,
    color: Colors.outline,
  },

  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 36,
  },
  lineItemLeft: { flex: 1, gap: 2 },
  lineItemName: { fontSize: 13, fontWeight: "500", color: Colors.onSurface },
  lineItemQty: { fontSize: 11, color: Colors.outline },
  lineItemPrice: { fontSize: 14, fontWeight: "700", color: Colors.onSurface },

  divider: { height: 1, backgroundColor: Colors.surfaceContainerHigh },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  summaryLabel: { fontSize: 13, color: Colors.outline },
  summaryValue: { fontSize: 13, fontWeight: "600", color: Colors.onSurface },
  totalRow: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  totalRowLabel: { fontSize: 14, fontWeight: "700", color: Colors.onSurface },
  totalRowValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primaryContainer,
  },

  taksitLink: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  taksitLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryContainer,
  },

  havaleInfo: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 14,
    gap: 6,
  },
  havaleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 2,
  },
  havaleText: { fontSize: 12, color: Colors.outline, lineHeight: 18 },
});
