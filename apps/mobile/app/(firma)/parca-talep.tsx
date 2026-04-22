import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

export default function ParcaTalepScreen() {
  const [selectedDepo, setSelectedDepo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [parcaAdi, setParcaAdi] = useState("");
  const [miktar, setMiktar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [depoModalVisible, setDepoModalVisible] = useState(false);

  const { data: depolarData, isLoading: depolarLoading } = useQuery({
    queryKey: ["firma-depolar"],
    queryFn: () => api.firmaDepolar() as Promise<{ locations: any[] }>,
  });

  const locations = depolarData?.locations ?? [];

  const handleSubmit = () => {
    if (!selectedDepo) {
      Alert.alert("Hata", "Lütfen bir depo seçin.");
      return;
    }
    if (!parcaAdi.trim()) {
      Alert.alert("Hata", "Parça adı zorunludur.");
      return;
    }
    if (!miktar.trim() || isNaN(Number(miktar)) || Number(miktar) <= 0) {
      Alert.alert("Hata", "Geçerli bir miktar girin.");
      return;
    }
    Alert.alert("Başarılı", "Talebiniz alındı.", [
      { text: "Tamam", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Parça Talep" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Depo Seçimi */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Depo Seçimi</Text>
          <TouchableOpacity
            style={[styles.picker, Shadow.navy]}
            onPress={() => setDepoModalVisible(true)}
            activeOpacity={0.8}
          >
            {depolarLoading ? (
              <ActivityIndicator size="small" color={Colors.primaryContainer} />
            ) : (
              <Text
                style={[
                  styles.pickerText,
                  !selectedDepo && styles.pickerPlaceholder,
                ]}
              >
                {selectedDepo ? selectedDepo.name : "Depo seçin..."}
              </Text>
            )}
            <Text style={styles.pickerChevron}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Parça Adı */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Parça Adı</Text>
          <TextInput
            style={[styles.input, Shadow.navy]}
            placeholder="Parça adını girin"
            placeholderTextColor={Colors.outline}
            value={parcaAdi}
            onChangeText={setParcaAdi}
          />
        </View>

        {/* Miktar */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Miktar</Text>
          <TextInput
            style={[styles.input, Shadow.navy]}
            placeholder="Adet"
            placeholderTextColor={Colors.outline}
            value={miktar}
            onChangeText={setMiktar}
            keyboardType="numeric"
          />
        </View>

        {/* Açıklama */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Açıklama (opsiyonel)</Text>
          <TextInput
            style={[styles.input, styles.textArea, Shadow.navy]}
            placeholder="Ek bilgi veya not..."
            placeholderTextColor={Colors.outline}
            value={aciklama}
            onChangeText={setAciklama}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <PrimaryButton
          label="Talep Gönder"
          onPress={handleSubmit}
          size="lg"
        />
      </ScrollView>

      {/* Depo Seçim Modal */}
      <Modal
        visible={depoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDepoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Depo Seç</Text>
              <TouchableOpacity
                onPress={() => setDepoModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedDepo?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedDepo({ id: item.id, name: item.name });
                    setDepoModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {item.city ? (
                    <Text style={styles.modalItemSub}>{item.city}</Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalEmpty}>Depo bulunamadı</Text>
              }
            />
          </View>
        </View>
      </Modal>
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
    minHeight: 100,
    paddingTop: 14,
  },
  picker: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  pickerText: {
    fontSize: 15,
    color: Colors.onSurface,
    flex: 1,
  },
  pickerPlaceholder: { color: Colors.outline },
  pickerChevron: {
    fontSize: 16,
    color: Colors.outline,
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "60%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.outline,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 2,
    minHeight: 56,
    justifyContent: "center",
  },
  modalItemSelected: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  modalItemSub: {
    fontSize: 12,
    color: Colors.outline,
  },
  modalEmpty: {
    padding: 24,
    textAlign: "center",
    color: Colors.outline,
    fontSize: 14,
  },
});
