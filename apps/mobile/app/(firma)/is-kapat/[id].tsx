import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

const QC_ITEMS = [
  "Araç temizlendi",
  "Test sürüşü yapıldı",
  "Müşteri bilgilendirildi",
  "Fatura hazırlandı",
];

export default function IsKapatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");

  function toggleItem(item: string) {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.firmaServisKapat(id, { qualityCheckNotes: notes }),
    onSuccess: () => {
      Alert.alert("Başarılı", "İş başarıyla kapatıldı", [
        {
          text: "Tamam",
          onPress: () => router.replace("/(firma)/panel" as any),
        },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message ?? "İş kapatılamadı");
    },
  });

  function handleSubmit() {
    mutation.mutate();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="İşi Kapat" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* QC Checklist */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.cardTitle}>Kalite Kontrol</Text>
          {QC_ITEMS.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.checkItem}
              onPress={() => toggleItem(item)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  checked[item] && styles.checkboxChecked,
                ]}
              >
                {checked[item] ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.checkLabel,
                  checked[item] && styles.checkLabelDone,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.cardTitle}>Notlar</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Kalite kontrol notları..."
            placeholderTextColor={Colors.outline}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <PrimaryButton
          label="İşi Tamamla"
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
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 8,
  },

  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
  },
  checkLabelDone: {
    color: Colors.outline,
    textDecorationLine: "line-through",
  },

  textArea: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.onSurface,
    minHeight: 120,
    lineHeight: 20,
  },
});
