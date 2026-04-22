import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface ReportItem {
  icon: string;
  title: string;
  description: string;
  route: string;
}

const REPORTS: ReportItem[] = [
  {
    icon: "💰",
    title: "Aylık Gelir Raporu",
    description: "Kategori bazlı gelir dağılımı ve aylık karşılaştırma",
    route: "/(firma)/gelir-raporu",
  },
  {
    icon: "🔧",
    title: "Servis Operasyon Raporu",
    description: "Tamamlanan servisler, ortalama süre ve durum dağılımı",
    route: "/(firma)/servis-raporu",
  },
  {
    icon: "📦",
    title: "Stok Durum Raporu",
    description: "Kritik stok seviyeleri ve son hareketler",
    route: "/(firma)/stok",
  },
  {
    icon: "👤",
    title: "Personel Performans Raporu",
    description: "Usta bazlı tamamlanan iş ve verimlilik metrikleri",
    route: "/(firma)/personel-performans",
  },
];

export default function RaporlarScreen() {
  const handlePdfDownload = (title: string) => {
    Alert.alert("PDF Hazırlanıyor", `"${title}" raporu hazırlanıyor...`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Raporlar" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {REPORTS.map((report) => (
          <View key={report.route} style={[styles.card, Shadow.navy]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{report.icon}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{report.title}</Text>
                <Text style={styles.cardDesc}>{report.description}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.btnIncele}
                onPress={() => router.push(report.route as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnInceleText}>İncele</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPdf}
                onPress={() => handlePdfDownload(report.title)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPdfText}>📄 PDF İndir</Text>
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
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.outline,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  btnIncele: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  btnInceleText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnPdf: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPdfText: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: "600",
  },
});
