import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { ThemeToggle } from "@/components/theme-toggle";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface SettingRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function SettingRow({ icon, title, description, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIconWrap}>
        <Text style={styles.settingIcon}>{icon}</Text>
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primaryContainer }}
        thumbColor={Colors.surfaceContainerLowest}
      />
    </View>
  );
}

export default function AyarlarScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [languageEnglish, setLanguageEnglish] = useState(false);

  function handleLogout() {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => Alert.alert("Çıkış yapılıyor..."),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Ayarlar" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Bildirimler section */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>BİLDİRİMLER</Text>
        </View>
        <View style={[styles.card, Shadow.navy]}>
          <SettingRow
            icon="🔔"
            title="Push Bildirimleri"
            description="Servis güncellemeleri ve uyarılar için bildirim al"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
        </View>

        {/* Güvenlik section */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>GÜVENLİK</Text>
        </View>
        <View style={[styles.card, Shadow.navy]}>
          <SettingRow
            icon="👆"
            title="Biyometrik Giriş"
            description="Parmak izi veya yüz tanıma ile hızlı giriş"
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
          />
        </View>

        {/* Dil section */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>DİL / LANGUAGE</Text>
        </View>
        <View style={[styles.card, Shadow.navy]}>
          <SettingRow
            icon="🌐"
            title="English"
            description="Switch app language to English"
            value={languageEnglish}
            onValueChange={setLanguageEnglish}
          />
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aktif Dil</Text>
            <Text style={styles.infoValue}>{languageEnglish ? "English" : "Türkçe"}</Text>
          </View>
        </View>

        {/* Tema section */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>TEMA / THEME</Text>
        </View>
        <View style={[styles.card, Shadow.navy]}>
          <ThemeToggle />
        </View>

        {/* Uygulama bilgisi */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>UYGULAMA</Text>
        </View>
        <View style={[styles.card, Shadow.navy]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versiyon</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>MS Oto Servis</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },

  sectionLabel: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 0.8,
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    minHeight: 72,
  },
  settingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  settingIcon: { fontSize: 20 },
  settingInfo: { flex: 1, gap: 2 },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.outline,
    lineHeight: 16,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: 16,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.outline,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
  },

  logoutBtn: {
    marginTop: 16,
    height: 52,
    backgroundColor: Colors.error,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
