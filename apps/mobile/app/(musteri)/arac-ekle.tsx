import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { StepIndicator } from "@/components/StepIndicator";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

const STEPS = ["Bilgiler", "Belgeler", "Onay"];

interface VehicleForm {
  plate: string;
  brand: string;
  model: string;
  year: string;
}

export default function AracEkleScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<VehicleForm>({
    plate: "",
    brand: "",
    model: "",
    year: "",
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.musteriAracEkle({
        plate: form.plate.toUpperCase(),
        brand: form.brand,
        model: form.model,
        year: form.year ? parseInt(form.year, 10) : undefined,
      }),
    onSuccess: () => {
      Alert.alert("Başarılı", "Araç başarıyla eklendi", [
        { text: "Tamam", onPress: () => router.replace("/(musteri)/panel") },
      ]);
    },
    onError: (err: any) =>
      Alert.alert("Hata", err?.message ?? "Araç eklenemedi. Lütfen tekrar deneyin."),
  });

  function handleBack() {
    if (currentStep === 0) {
      router.back();
    } else {
      setCurrentStep((s) => s - 1);
    }
  }

  function validateStep1(): boolean {
    if (!form.plate.trim()) {
      Alert.alert("Eksik Bilgi", "Plaka alanı zorunludur.");
      return false;
    }
    if (!form.brand.trim()) {
      Alert.alert("Eksik Bilgi", "Marka alanı zorunludur.");
      return false;
    }
    if (!form.model.trim()) {
      Alert.alert("Eksik Bilgi", "Model alanı zorunludur.");
      return false;
    }
    return true;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Araç Ekle" onBack={handleBack} />
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 0 && (
            <Step1
              form={form}
              onChange={(key, val) => setForm((f) => ({ ...f, [key]: val }))}
              onNext={() => {
                if (validateStep1()) setCurrentStep(1);
              }}
            />
          )}

          {currentStep === 1 && (
            <Step2
              onNext={() => setCurrentStep(2)}
              onSkip={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step3
              form={form}
              loading={addMutation.isPending}
              onConfirm={() => addMutation.mutate()}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Step 1: Vehicle Info ─────────────────────────────────────────────────────

function Step1({
  form,
  onChange,
  onNext,
}: {
  form: VehicleForm;
  onChange: (key: keyof VehicleForm, val: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Araç Bilgileri</Text>
      <Text style={styles.stepSubtitle}>Aracınızın bilgilerini girin</Text>

      <View style={styles.fieldGroup}>
        <FieldLabel label="Plaka *" />
        <TextInput
          style={styles.input}
          value={form.plate}
          onChangeText={(v) => onChange("plate", v.toUpperCase())}
          placeholder="34 ABC 123"
          placeholderTextColor={Colors.outline}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <View style={styles.fieldGroup}>
        <FieldLabel label="Marka *" />
        <TextInput
          style={styles.input}
          value={form.brand}
          onChangeText={(v) => onChange("brand", v)}
          placeholder="Toyota, BMW, Ford..."
          placeholderTextColor={Colors.outline}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldGroup}>
        <FieldLabel label="Model *" />
        <TextInput
          style={styles.input}
          value={form.model}
          onChangeText={(v) => onChange("model", v)}
          placeholder="Corolla, 3 Serisi, Focus..."
          placeholderTextColor={Colors.outline}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldGroup}>
        <FieldLabel label="Yıl" />
        <TextInput
          style={styles.input}
          value={form.year}
          onChangeText={(v) => onChange("year", v.replace(/[^0-9]/g, ""))}
          placeholder="2020"
          placeholderTextColor={Colors.outline}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.photoPlaceholder, Shadow.navy]}
        onPress={() => Alert.alert("Fotoğraf Ekle", "Kamera özelliği yakında eklenecek.")}
        activeOpacity={0.8}
      >
        <Text style={styles.photoIcon}>📷</Text>
        <Text style={styles.photoLabel}>Fotoğraf Ekle</Text>
        <Text style={styles.photoHint}>İsteğe bağlı</Text>
      </TouchableOpacity>

      <PrimaryButton label="Devam Et" onPress={onNext} size="lg" />
    </View>
  );
}

// ─── Step 2: Documents ────────────────────────────────────────────────────────

function Step2({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Belgeler</Text>
      <Text style={styles.stepSubtitle}>Araç belgelerinizi yükleyin (isteğe bağlı)</Text>

      <TouchableOpacity
        style={[styles.uploadBtn, Shadow.navy]}
        onPress={() => Alert.alert("Ruhsat Yükle", "Belge yükleme özelliği yakında eklenecek.")}
        activeOpacity={0.8}
      >
        <Text style={styles.uploadIcon}>📋</Text>
        <View style={styles.uploadText}>
          <Text style={styles.uploadTitle}>Ruhsat Yükle</Text>
          <Text style={styles.uploadHint}>PDF veya fotoğraf</Text>
        </View>
        <Text style={styles.uploadArrow}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.uploadBtn, Shadow.navy]}
        onPress={() =>
          Alert.alert("Sigorta Belgesi Yükle", "Belge yükleme özelliği yakında eklenecek.")
        }
        activeOpacity={0.8}
      >
        <Text style={styles.uploadIcon}>🛡️</Text>
        <View style={styles.uploadText}>
          <Text style={styles.uploadTitle}>Sigorta Belgesi Yükle</Text>
          <Text style={styles.uploadHint}>PDF veya fotoğraf</Text>
        </View>
        <Text style={styles.uploadArrow}>+</Text>
      </TouchableOpacity>

      <PrimaryButton label="Devam Et" onPress={onNext} size="lg" />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={onSkip}
        hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
      >
        <Text style={styles.skipText}>Atla</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 3: Confirmation ─────────────────────────────────────────────────────

function Step3({
  form,
  loading,
  onConfirm,
}: {
  form: VehicleForm;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Onay</Text>
      <Text style={styles.stepSubtitle}>Araç bilgilerini kontrol edin</Text>

      <View style={[styles.summaryCard, Shadow.navy]}>
        <Text style={styles.summaryTitle}>Araç Özeti</Text>

        <SummaryRow label="Plaka" value={form.plate || "—"} highlight />
        <SummaryRow label="Marka" value={form.brand || "—"} />
        <SummaryRow label="Model" value={form.model || "—"} />
        <SummaryRow label="Yıl" value={form.year || "—"} />
      </View>

      <PrimaryButton
        label="Aracı Kaydet"
        onPress={onConfirm}
        loading={loading}
        size="lg"
      />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },

  stepContainer: { gap: 16 },
  stepTitle: { fontSize: 20, fontWeight: "800", color: Colors.onSurface },
  stepSubtitle: { fontSize: 14, color: Colors.outline, marginTop: -8 },

  // Fields
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.onSurface },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.onSurface,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },

  // Photo placeholder
  photoPlaceholder: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
    gap: 6,
    minHeight: 96,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderStyle: "dashed",
  },
  photoIcon: { fontSize: 28 },
  photoLabel: { fontSize: 14, fontWeight: "600", color: Colors.primaryContainer },
  photoHint: { fontSize: 12, color: Colors.outline },

  // Upload buttons
  uploadBtn: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
  },
  uploadIcon: { fontSize: 26 },
  uploadText: { flex: 1, gap: 2 },
  uploadTitle: { fontSize: 15, fontWeight: "600", color: Colors.onSurface },
  uploadHint: { fontSize: 12, color: Colors.outline },
  uploadArrow: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primaryContainer,
    width: 32,
    textAlign: "center",
  },

  // Skip
  skipBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: "center",
  },
  skipText: { fontSize: 14, color: Colors.outline, fontWeight: "600" },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 14,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.outline,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32,
  },
  summaryLabel: { fontSize: 14, color: Colors.outline },
  summaryValue: { fontSize: 15, fontWeight: "600", color: Colors.onSurface },
  summaryValueHighlight: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 1.5,
  },
});
