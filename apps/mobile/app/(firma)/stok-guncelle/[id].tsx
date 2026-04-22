import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Colors, Radius, Shadow } from "@/constants/theme";

type MovementType = "IN" | "OUT" | "ADJUST";

const MOVEMENT_OPTIONS: { label: string; value: MovementType }[] = [
  { label: "Giriş", value: "IN" },
  { label: "Çıkış", value: "OUT" },
  { label: "Düzeltme", value: "ADJUST" },
];

export default function StokGuncelleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movementType, setMovementType] = useState<MovementType>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.firmaStokGuncelle(id, {
        quantity: Number(quantity),
        type: movementType,
        reason: reason.trim() || undefined,
      }) as Promise<any>,
    onSuccess: () => {
      Alert.alert("Başarılı", "Stok güncellendi.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message ?? "Stok güncellenemedi.");
    },
  });

  const handleSubmit = () => {
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert("Hata", "Geçerli bir miktar girin.");
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Stok Güncelle" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Movement Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hareket Tipi</Text>
          <SegmentedControl
            options={MOVEMENT_OPTIONS}
            selected={movementType}
            onChange={(v) => setMovementType(v as MovementType)}
          />
        </View>

        {/* Quantity */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Miktar</Text>
          <TextInput
            style={[styles.input, Shadow.navy]}
            placeholder="Adet girin"
            placeholderTextColor={Colors.outline}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>

        {/* Reason */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Açıklama (opsiyonel)</Text>
          <TextInput
            style={[styles.input, styles.textArea, Shadow.navy]}
            placeholder="Hareket nedeni..."
            placeholderTextColor={Colors.outline}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Type info card */}
        <View style={[styles.infoCard, Shadow.navy]}>
          <Text style={styles.infoIcon}>
            {movementType === "IN" ? "📦" : movementType === "OUT" ? "📤" : "⚖️"}
          </Text>
          <View style={styles.infoBody}>
            <Text style={styles.infoTitle}>
              {movementType === "IN"
                ? "Stok Girişi"
                : movementType === "OUT"
                  ? "Stok Çıkışı"
                  : "Stok Düzeltme"}
            </Text>
            <Text style={styles.infoDesc}>
              {movementType === "IN"
                ? "Mevcut stok miktarı artırılacak."
                : movementType === "OUT"
                  ? "Mevcut stok miktarı azaltılacak."
                  : "Stok miktarı değişmez, sadece hareket kaydı oluşturulur."}
            </Text>
          </View>
        </View>

        <PrimaryButton
          label="Güncelle"
          onPress={handleSubmit}
          loading={mutation.isPending}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurface,
    marginLeft: 2,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.onSurface,
    minHeight: 48,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },

  infoCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: { fontSize: 24, marginTop: 2 },
  infoBody: { flex: 1, gap: 3 },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  infoDesc: {
    fontSize: 13,
    color: Colors.outline,
    lineHeight: 18,
  },
});
