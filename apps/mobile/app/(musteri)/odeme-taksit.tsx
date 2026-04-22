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

const TOTAL = 1670; // mock total from odeme screen

const INSTALLMENT_PLANS = [
  {
    id: "1",
    label: "Tek Çekim",
    months: 1,
    monthly: TOTAL,
    interest: 0,
    note: "Faiz yok",
    recommended: true,
  },
  {
    id: "3",
    label: "3 Taksit",
    months: 3,
    monthly: Math.ceil(TOTAL / 3),
    interest: 0,
    note: "Faizsiz",
    recommended: false,
  },
  {
    id: "6",
    label: "6 Taksit",
    months: 6,
    monthly: Math.ceil((TOTAL * 1.05) / 6),
    interest: 5,
    note: "%5 faiz",
    recommended: false,
  },
  {
    id: "12",
    label: "12 Taksit",
    months: 12,
    monthly: Math.ceil((TOTAL * 1.12) / 12),
    interest: 12,
    note: "%12 faiz uygulanır",
    recommended: false,
  },
];

export default function OdemeTaksitScreen() {
  const [selected, setSelected] = useState("1");

  const selectedPlan = INSTALLMENT_PLANS.find((p) => p.id === selected)!;

  function handleSelect() {
    Alert.alert(
      "Taksit Planı",
      `${selectedPlan.label} seçildi`,
      [
        {
          text: "Tamam",
          onPress: () => router.back(),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Taksit Seçenekleri" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Toplam tutar için uygun taksit planını seçin
        </Text>

        {INSTALLMENT_PLANS.map((plan) => {
          const isSelected = plan.id === selected;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.8}
            >
              <View style={styles.planLeft}>
                <View style={styles.planLabelRow}>
                  <Text
                    style={[
                      styles.planLabel,
                      isSelected && styles.planLabelSelected,
                    ]}
                  >
                    {plan.label}
                  </Text>
                  {plan.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Önerilen</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planNote}>{plan.note}</Text>
              </View>

              <View style={styles.planRight}>
                <Text
                  style={[
                    styles.planMonthly,
                    isSelected && styles.planMonthlySelected,
                  ]}
                >
                  ₺{plan.monthly.toLocaleString("tr-TR")}
                </Text>
                {plan.months > 1 && (
                  <Text style={styles.planMonthlyLabel}>/ ay</Text>
                )}
                {plan.months === 1 && (
                  <Text style={styles.planMonthlyLabel}>tek seferlik</Text>
                )}
              </View>

              {/* Radio indicator */}
              <View
                style={[
                  styles.radio,
                  isSelected && styles.radioSelected,
                ]}
              >
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Summary */}
        {selectedPlan && (
          <View style={[styles.summaryCard, Shadow.navy]}>
            <Text style={styles.summaryTitle}>Seçilen Plan Özeti</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{selectedPlan.label}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Aylık Ödeme</Text>
              <Text style={styles.summaryValue}>
                ₺{selectedPlan.monthly.toLocaleString("tr-TR")}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Toplam Ödenecek</Text>
              <Text style={[styles.summaryValue, styles.summaryTotal]}>
                ₺
                {(selectedPlan.monthly * selectedPlan.months).toLocaleString(
                  "tr-TR"
                )}
              </Text>
            </View>
          </View>
        )}

        <PrimaryButton
          label="Bu Planı Seç"
          size="lg"
          onPress={handleSelect}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  subtitle: {
    fontSize: 13,
    color: Colors.outline,
    marginBottom: 4,
  },

  planCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    minHeight: 72,
    ...Shadow.navy,
  },
  planCardSelected: {
    borderColor: Colors.primaryContainer,
    backgroundColor: "#eff6ff",
  },

  planLeft: { flex: 1, gap: 4 },
  planLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  planLabelSelected: { color: Colors.primaryContainer },
  planNote: { fontSize: 12, color: Colors.outline },

  recommendedBadge: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.xl,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.secondary,
  },

  planRight: { alignItems: "flex-end" },
  planMonthly: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.onSurface,
  },
  planMonthlySelected: { color: Colors.primaryContainer },
  planMonthlyLabel: { fontSize: 11, color: Colors.outline, marginTop: 2 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: { borderColor: Colors.primaryContainer },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryContainer,
  },

  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  summaryLabel: { fontSize: 13, color: Colors.outline },
  summaryValue: { fontSize: 13, fontWeight: "600", color: Colors.onSurface },
  summaryTotal: { color: Colors.primaryContainer, fontSize: 15, fontWeight: "800" },
});
