import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

const PAYMENT_METHODS = [
  { label: "Nakit", value: "CASH" },
  { label: "Kredi Kartı", value: "CARD" },
  { label: "Havale", value: "TRANSFER" },
];

export default function TahsilatEkleScreen() {
  const [musteriAdi, setMusteriAdi] = useState("");
  const [tutar, setTutar] = useState("");
  const [odemeyontemi, setOdemeYontemi] = useState("CASH");
  const [not, setNot] = useState("");

  const handleSubmit = () => {
    if (!musteriAdi.trim()) {
      Alert.alert("Hata", "Müşteri adı zorunludur.");
      return;
    }
    const amount = parseFloat(tutar.replace(",", "."));
    if (!tutar.trim() || isNaN(amount) || amount <= 0) {
      Alert.alert("Hata", "Geçerli bir tutar giriniz.");
      return;
    }
    Alert.alert("Başarılı", "Tahsilat kaydedildi.", [
      { text: "Tamam", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Tahsilat Ekle" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, Shadow.navy]}>
            {/* Müşteri Adı */}
            <View style={styles.field}>
              <Text style={styles.label}>Müşteri Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                placeholderTextColor={Colors.outline}
                value={musteriAdi}
                onChangeText={setMusteriAdi}
                autoCapitalize="words"
              />
            </View>

            {/* Tutar */}
            <View style={styles.field}>
              <Text style={styles.label}>Tutar</Text>
              <View style={styles.amountRow}>
                <View style={styles.prefix}>
                  <Text style={styles.prefixText}>₺</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0,00"
                  placeholderTextColor={Colors.outline}
                  value={tutar}
                  onChangeText={setTutar}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Ödeme Yöntemi */}
            <View style={styles.field}>
              <Text style={styles.label}>Ödeme Yöntemi</Text>
              <SegmentedControl
                options={PAYMENT_METHODS}
                selected={odemeyontemi}
                onChange={setOdemeYontemi}
              />
            </View>

            {/* Not */}
            <View style={styles.field}>
              <Text style={styles.label}>Not (İsteğe Bağlı)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Açıklama ekleyin..."
                placeholderTextColor={Colors.outline}
                value={not}
                onChangeText={setNot}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <PrimaryButton label="Tahsilatı Kaydet" onPress={handleSubmit} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 16,
  },
  field: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  input: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.onSurface,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  prefix: {
    height: 48,
    width: 44,
    backgroundColor: Colors.surfaceContainerHigh,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  prefixText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  amountInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  textArea: {
    height: 88,
    paddingTop: 12,
  },
});
