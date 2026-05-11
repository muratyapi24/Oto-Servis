import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface Document {
  id: string;
  name: string;
  type: "PDF";
  size: string;
  date: string;
}

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "1",
    name: "Servis Raporu.pdf",
    type: "PDF",
    size: "245 KB",
    date: "12 Haz 2025",
  },
  {
    id: "2",
    name: "Fatura.pdf",
    type: "PDF",
    size: "118 KB",
    date: "12 Haz 2025",
  },
  {
    id: "3",
    name: "Garanti Belgesi.pdf",
    type: "PDF",
    size: "89 KB",
    date: "12 Haz 2025",
  },
];

function handleDownload(name: string) {
  Alert.alert("İndiriliyor", `${name} indiriliyor...`, [{ text: "Tamam" }]);
}

function handleShare(name: string) {
  Alert.alert("Paylaşılıyor", `${name} paylaşılıyor...`, [{ text: "Tamam" }]);
}

export default function BelgelerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Servis Belgeleri" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Servis #{id} Belgeleri</Text>

        {(__DEV__ ? MOCK_DOCUMENTS : []).map((doc) => (
          <View key={doc.id} style={[styles.card, Shadow.navy]}>
            {/* File info */}
            <View style={styles.cardTop}>
              <View style={styles.fileIconWrap}>
                <Text style={styles.fileIcon}>📄</Text>
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {doc.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {doc.type} · {doc.size} · {doc.date}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDownload(doc.name)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>⬇ İndir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline]}
                onPress={() => handleShare(doc.name)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnOutlineText}>↗ Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.outline,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 14,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  fileIcon: { fontSize: 24 },

  fileInfo: { flex: 1, gap: 4 },
  fileName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  fileMeta: {
    fontSize: 12,
    color: Colors.outline,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  actionBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primaryContainer,
  },
  actionBtnOutlineText: {
    color: Colors.primaryContainer,
    fontSize: 14,
    fontWeight: "700",
  },
});
