import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GlassHeader } from "@/components/GlassHeader";
import { StepIndicator } from "@/components/StepIndicator";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

const SERVICE_TYPES = [
  "Periyodik Bakım",
  "Yağ Değişimi",
  "Fren Kontrolü",
  "Lastik Değişimi",
  "Genel Kontrol",
  "Klima Bakımı",
  "Akü Kontrolü",
  "Diğer",
];

const STEPS = ["Araç", "Hizmet", "Özet"];

export default function RandevuScreen() {
  const [step, setStep] = useState(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["musteri-panel"],
    queryFn: () => api.musteriPanel() as Promise<any>,
  });

  const vehicles: any[] = data?.vehicles ?? [];
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  function handleNext() {
    if (step === 0) {
      if (!selectedVehicleId) {
        Alert.alert("Araç Seçin", "Lütfen bir araç seçin.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!selectedService) {
        Alert.alert("Hizmet Seçin", "Lütfen bir hizmet türü seçin.");
        return;
      }
      setStep(2);
    }
  }

  function handleConfirm() {
    Alert.alert(
      "Randevunuz oluşturuldu!",
      `${selectedVehicle?.plate} için ${selectedService} randevunuz alındı.`,
      [{ text: "Tamam", onPress: () => router.back() }]
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader
        title="Randevu Al"
        onBack={step > 0 ? () => setStep(step - 1) : undefined}
      />

      <StepIndicator steps={STEPS} currentStep={step} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Vehicle Selection */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Araç Seçin</Text>
            <Text style={styles.stepSubtitle}>Randevu almak istediğiniz aracı seçin</Text>

            {vehicles.length === 0 ? (
              <View style={styles.emptyVehicles}>
                <Text style={styles.emptyIcon}>🚗</Text>
                <Text style={styles.emptyText}>Kayıtlı araç bulunamadı</Text>
              </View>
            ) : (
              vehicles.map((v: any) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.vehicleCard,
                    Shadow.navy,
                    selectedVehicleId === v.id && styles.vehicleCardSelected,
                  ]}
                  onPress={() => setSelectedVehicleId(v.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.vehicleCardLeft}>
                    <Text style={styles.vehiclePlate}>{v.plate}</Text>
                    <Text style={styles.vehicleName}>
                      {v.year} {v.brand} {v.model}
                    </Text>
                  </View>
                  {selectedVehicleId === v.id && (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}

            <View style={styles.nextBtn}>
              <PrimaryButton
                label="Devam Et →"
                onPress={handleNext}
                disabled={!selectedVehicleId}
              />
            </View>
          </View>
        )}

        {/* Step 2: Service + Date/Time */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Hizmet Seçin</Text>
            <Text style={styles.stepSubtitle}>Almak istediğiniz hizmeti ve tarihi belirtin</Text>

            <Text style={styles.fieldLabel}>Hizmet Türü</Text>
            <View style={styles.chipGrid}>
              {SERVICE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    selectedService === type && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedService(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedService === type && styles.chipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Tarih</Text>
            <TextInput
              style={styles.textInput}
              placeholder="gg.aa.yyyy"
              placeholderTextColor={Colors.outline}
              value={selectedDate}
              onChangeText={setSelectedDate}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Saat</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ss:dd (örn. 10:00)"
              placeholderTextColor={Colors.outline}
              value={selectedTime}
              onChangeText={setSelectedTime}
              keyboardType="numeric"
            />

            <View style={styles.nextBtn}>
              <PrimaryButton
                label="Özete Git →"
                onPress={handleNext}
                disabled={!selectedService}
              />
            </View>
          </View>
        )}

        {/* Step 3: Summary */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Randevu Özeti</Text>
            <Text style={styles.stepSubtitle}>Bilgilerinizi kontrol edin ve onaylayın</Text>

            <View style={[styles.summaryCard, Shadow.navy]}>
              <SummaryRow icon="🚗" label="Araç" value={`${selectedVehicle?.plate} — ${selectedVehicle?.brand} ${selectedVehicle?.model}`} />
              <View style={styles.summaryDivider} />
              <SummaryRow icon="🔧" label="Hizmet" value={selectedService ?? "—"} />
              <View style={styles.summaryDivider} />
              <SummaryRow icon="📅" label="Tarih" value={selectedDate || "Belirtilmedi"} />
              <View style={styles.summaryDivider} />
              <SummaryRow icon="🕐" label="Saat" value={selectedTime || "Belirtilmedi"} />
            </View>

            <View style={styles.nextBtn}>
              <PrimaryButton label="Randevu Oluştur" onPress={handleConfirm} />
            </View>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => setStep(1)}
            >
              <Text style={styles.backLinkText}>← Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={srStyles.row}>
      <Text style={srStyles.icon}>{icon}</Text>
      <View style={srStyles.content}>
        <Text style={srStyles.label}>{label}</Text>
        <Text style={srStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const srStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  icon: { fontSize: 20, width: 28, textAlign: "center" },
  content: { flex: 1 },
  label: { fontSize: 11, color: Colors.outline, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 15, fontWeight: "600", color: Colors.onSurface, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  stepContent: { gap: 14 },
  stepTitle: { fontSize: 20, fontWeight: "800", color: Colors.onSurface },
  stepSubtitle: { fontSize: 14, color: Colors.outline },

  emptyVehicles: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: Colors.outline },

  vehicleCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 72,
    borderWidth: 2,
    borderColor: "transparent",
  },
  vehicleCardSelected: {
    borderColor: Colors.primaryContainer,
    backgroundColor: "#eff6ff",
  },
  vehicleCardLeft: { gap: 4 },
  vehiclePlate: { fontSize: 18, fontWeight: "800", color: Colors.primary, letterSpacing: 1.5 },
  vehicleName: { fontSize: 13, color: Colors.outline },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: { color: "#fff", fontSize: 14, fontWeight: "800" },

  fieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.onSurface, marginTop: 4 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    minHeight: 40,
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  chipText: { fontSize: 13, color: Colors.onSurface, fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "700" },

  textInput: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15,
    color: Colors.onSurface,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
  },

  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 8,
  },

  nextBtn: { marginTop: 8 },
  backLink: { alignItems: "center", paddingVertical: 14, minHeight: 48, justifyContent: "center" },
  backLinkText: { fontSize: 14, color: Colors.primaryContainer, fontWeight: "600" },
});
