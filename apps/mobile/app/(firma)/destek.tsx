import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    question: "Servis kaydı nasıl oluşturulur?",
    answer:
      "Ana panelden 'Yeni Servis' butonuna tıklayarak araç plakası ve şikayet bilgilerini girerek yeni bir servis kaydı oluşturabilirsiniz. Usta ataması ve parça talebi aynı ekrandan yapılabilir.",
  },
  {
    id: "2",
    question: "Stok uyarıları nasıl çalışır?",
    answer:
      "Her parça için minimum stok seviyesi tanımlanabilir. Stok bu seviyenin altına düştüğünde otomatik olarak bildirim gönderilir ve panel ekranında kritik uyarı olarak gösterilir.",
  },
  {
    id: "3",
    question: "Müşteriye nasıl bildirim gönderilir?",
    answer:
      "Servis durumu güncellendiğinde (tamamlandı, onay bekliyor vb.) müşteriye otomatik push bildirimi gönderilir. Ayrıca mesajlar ekranından manuel mesaj da iletebilirsiniz.",
  },
  {
    id: "4",
    question: "Biyometrik giriş nasıl etkinleştirilir?",
    answer:
      "Ayarlar ekranından 'Biyometrik Giriş' seçeneğini açabilirsiniz. Cihazınızda kayıtlı parmak izi veya yüz tanıma kullanılarak hızlı giriş yapılabilir.",
  },
  {
    id: "5",
    question: "Raporları nasıl indirebilirim?",
    answer:
      "Raporlar ekranından istediğiniz rapor türünü seçip 'PDF İndir' butonuna tıklayabilirsiniz. Rapor cihazınıza kaydedilir ve paylaşım seçenekleri sunulur.",
  },
];

async function openLink(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Hata", "Bu bağlantı açılamıyor.");
    }
  } catch {
    Alert.alert("Hata", "Bağlantı açılırken bir sorun oluştu.");
  }
}

export default function DestekScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleFaq(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Destek" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>
        <View style={[styles.faqCard, Shadow.navy]}>
          {FAQ_ITEMS.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => toggleFaq(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.faqQuestion} numberOfLines={expandedId === item.id ? undefined : 2}>
                  {item.question}
                </Text>
                <Text style={styles.faqChevron}>
                  {expandedId === item.id ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {expandedId === item.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <Text style={styles.sectionTitle}>İletişim</Text>
        <View style={styles.contactGrid}>
          <TouchableOpacity
            style={[styles.contactBtn, Shadow.navy]}
            onPress={() => openLink("tel:+908501234567")}
            activeOpacity={0.85}
          >
            <Text style={styles.contactBtnIcon}>📞</Text>
            <Text style={styles.contactBtnTitle}>Telefon ile Ara</Text>
            <Text style={styles.contactBtnSub}>0850 123 45 67</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactBtn, Shadow.navy]}
            onPress={() => openLink("mailto:destek@bstotoservis.com")}
            activeOpacity={0.85}
          >
            <Text style={styles.contactBtnIcon}>✉️</Text>
            <Text style={styles.contactBtnTitle}>E-posta Gönder</Text>
            <Text style={styles.contactBtnSub}>destek@bstotoservis.com</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactBtn, styles.whatsappBtn, Shadow.navy]}
            onPress={() => openLink("https://wa.me/908501234567")}
            activeOpacity={0.85}
          >
            <Text style={styles.contactBtnIcon}>💬</Text>
            <Text style={[styles.contactBtnTitle, styles.whatsappText]}>WhatsApp</Text>
            <Text style={[styles.contactBtnSub, styles.whatsappText]}>Hızlı destek</Text>
          </TouchableOpacity>
        </View>

        {/* Working hours */}
        <View style={[styles.hoursCard, Shadow.navy]}>
          <Text style={styles.hoursTitle}>⏰ Çalışma Saatleri</Text>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Pazartesi – Cuma</Text>
            <Text style={styles.hoursTime}>09:00 – 18:00</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Cumartesi</Text>
            <Text style={styles.hoursTime}>10:00 – 15:00</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Pazar</Text>
            <Text style={[styles.hoursTime, { color: Colors.error }]}>Kapalı</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: 8,
    marginBottom: 4,
  },

  faqCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: 16,
  },
  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    minHeight: 56,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
    lineHeight: 20,
  },
  faqChevron: {
    fontSize: 11,
    color: Colors.outline,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswerText: {
    fontSize: 13,
    color: Colors.outline,
    lineHeight: 20,
  },

  contactGrid: {
    gap: 10,
  },
  contactBtn: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
  },
  whatsappBtn: {
    backgroundColor: "#25D366",
  },
  contactBtnIcon: { fontSize: 24 },
  contactBtnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
    flex: 1,
  },
  contactBtnSub: {
    fontSize: 12,
    color: Colors.outline,
  },
  whatsappText: {
    color: "#fff",
  },

  hoursCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  hoursTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 4,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursDay: {
    fontSize: 13,
    color: Colors.outline,
  },
  hoursTime: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurface,
  },
});
