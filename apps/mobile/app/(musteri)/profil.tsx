import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Colors, Radius, Shadow } from "@/constants/theme";

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; min: number; max: number }> = {
  STANDARD: { label: "Standart", color: Colors.outline, bg: Colors.surfaceContainerHigh, icon: "⚪", min: 0, max: 500 },
  BRONZE:   { label: "Bronze",   color: "#92400e", bg: "#fef3c7", icon: "🥉", min: 0,    max: 1000 },
  SILVER:   { label: "Silver",   color: "#475569", bg: "#f1f5f9", icon: "🥈", min: 1000, max: 3000 },
  GOLD:     { label: "Gold",     color: "#b45309", bg: "#fffbeb", icon: "🥇", min: 3000, max: 7000 },
  PLATINUM: { label: "Platinum", color: "#1e3a8a", bg: "#eff6ff", icon: "💎", min: 7000, max: 7000 },
};

const TIER_ORDER = ["STANDARD", "BRONZE", "SILVER", "GOLD", "PLATINUM"];

const MOCK_REWARDS = [
  { id: "1", title: "Ücretsiz Yağ Değişimi", points: 500, icon: "🛢️" },
  { id: "2", title: "%10 İndirim Kuponu", points: 200, icon: "🎟️" },
  { id: "3", title: "Ücretsiz Araç Yıkama", points: 150, icon: "🚿" },
  { id: "4", title: "Klima Bakımı İndirimi", points: 350, icon: "❄️" },
];

function getNextTier(current: string): string | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

function calcProgress(points: number, tier: string): number {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.STANDARD;
  if (tier === "PLATINUM") return 100;
  const range = cfg.max - cfg.min;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, Math.floor(((points - cfg.min) / range) * 100)));
}

export default function ProfilScreen() {
  const { data: profilData, isLoading: profilLoading } = useQuery({
    queryKey: ["musteri-profil"],
    queryFn: () => api.musteriProfil() as Promise<any>,
    retry: false,
  });

  const { data: panelData, isLoading: panelLoading } = useQuery({
    queryKey: ["musteri-panel"],
    queryFn: () => api.musteriPanel() as Promise<any>,
    enabled: !profilData,
  });

  const isLoading = profilLoading && panelLoading;

  // Use profil data if available, fallback to panel
  const customer = profilData?.customer ?? panelData?.customer;
  const tierProgress = profilData?.tierProgress;

  const tier = customer?.membershipTier ?? "STANDARD";
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.STANDARD;
  const nextTier = getNextTier(tier);
  const nextTierCfg = nextTier ? TIER_CONFIG[nextTier] : null;
  const points = customer?.rewardPoints ?? 0;
  const progressPct = tierProgress?.progressPercent ?? calcProgress(points, tier);

  async function handleLogout() {
    Alert.alert("Çıkış", "Çıkış yapmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["auth_token", "user_role"]);
          router.replace("/(musteri)/login");
        },
      },
    ]);
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
      <GlassHeader title="Profilim" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Loyalty Hero Card */}
        <View style={[styles.loyaltyCard, Shadow.navy]}>
          <View style={styles.loyaltyTop}>
            <View style={styles.loyaltyLeft}>
              <View style={[styles.tierBadge, { backgroundColor: tierCfg.bg }]}>
                <Text style={styles.tierIcon}>{tierCfg.icon}</Text>
                <Text style={[styles.tierLabel, { color: tierCfg.color }]}>{tierCfg.label}</Text>
              </View>
              <Text style={styles.memberName}>
                {customer?.firstName} {customer?.lastName}
              </Text>
            </View>
            <View style={styles.pointsBox}>
              <Text style={styles.pointsValue}>{points.toLocaleString("tr-TR")}</Text>
              <Text style={styles.pointsLabel}>Puan</Text>
            </View>
          </View>

          {/* Tier Progress */}
          {nextTierCfg && (
            <View style={styles.tierProgress}>
              <View style={styles.tierProgressHeader}>
                <Text style={styles.tierProgressLabel}>
                  {nextTierCfg.label} seviyesine
                </Text>
                <Text style={styles.tierProgressPct}>{progressPct}%</Text>
              </View>
              <ProgressBar value={progressPct} height={8} color={tierCfg.color} />
              <Text style={styles.tierProgressHint}>
                {nextTierCfg.min - points > 0
                  ? `${(nextTierCfg.min - points).toLocaleString("tr-TR")} puan daha kazanın`
                  : "Bir sonraki seviyeye ulaştınız!"}
              </Text>
            </View>
          )}
          {!nextTierCfg && (
            <View style={styles.platinumBadge}>
              <Text style={styles.platinumText}>💎 En yüksek seviyedesiniz!</Text>
            </View>
          )}
        </View>

        {/* How to Earn Points */}
        <View style={[styles.guideCard, Shadow.navy]}>
          <Text style={styles.guideTitle}>Puan Nasıl Kazanılır?</Text>
          {[
            { icon: "🔧", text: "Her servis işleminde ₺1 = 1 puan" },
            { icon: "📅", text: "Randevu alarak 50 bonus puan" },
            { icon: "⭐", text: "Servis değerlendirmesi yaparak 25 puan" },
            { icon: "👥", text: "Arkadaş davet ederek 100 puan" },
          ].map((item, i) => (
            <View key={i} style={styles.guideRow}>
              <Text style={styles.guideIcon}>{item.icon}</Text>
              <Text style={styles.guideText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Rewards Marketplace */}
        <Text style={styles.sectionTitle}>Ödül Marketi</Text>
        {MOCK_REWARDS.map((reward) => (
          <View key={reward.id} style={[styles.rewardCard, Shadow.navy]}>
            <Text style={styles.rewardIcon}>{reward.icon}</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardPoints}>{reward.points} puan</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.rewardBtn,
                points < reward.points && styles.rewardBtnDisabled,
              ]}
              onPress={() =>
                Alert.alert("Puan bakiyeniz kontrol ediliyor...", `${reward.title} için ${reward.points} puan gerekiyor.`)
              }
            >
              <Text style={styles.rewardBtnText}>Al</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* QR Code Placeholder */}
        <Text style={styles.sectionTitle}>Mağaza QR Kodu</Text>
        <View style={[styles.qrCard, Shadow.navy]}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR Kod</Text>
            <Text style={styles.qrSubtext}>Mağazada puan kazanmak için gösterin</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Loyalty hero
  loyaltyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 16,
  },
  loyaltyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  loyaltyLeft: { gap: 8 },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.xl,
    alignSelf: "flex-start",
  },
  tierIcon: { fontSize: 16 },
  tierLabel: { fontSize: 13, fontWeight: "700" },
  memberName: { fontSize: 18, fontWeight: "700", color: Colors.onSurface },
  pointsBox: { alignItems: "flex-end" },
  pointsValue: { fontSize: 28, fontWeight: "800", color: Colors.primaryContainer },
  pointsLabel: { fontSize: 12, color: Colors.outline, marginTop: 2 },

  tierProgress: { gap: 6 },
  tierProgressHeader: { flexDirection: "row", justifyContent: "space-between" },
  tierProgressLabel: { fontSize: 12, color: Colors.outline },
  tierProgressPct: { fontSize: 12, fontWeight: "700", color: Colors.primaryContainer },
  tierProgressHint: { fontSize: 11, color: Colors.outline },

  platinumBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: Radius.md,
    padding: 10,
    alignItems: "center",
  },
  platinumText: { fontSize: 14, fontWeight: "700", color: Colors.primaryContainer },

  // Guide
  guideCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 18,
    gap: 12,
  },
  guideTitle: { fontSize: 15, fontWeight: "700", color: Colors.onSurface },
  guideRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  guideIcon: { fontSize: 18, width: 24, textAlign: "center" },
  guideText: { fontSize: 13, color: Colors.onSurface, flex: 1 },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.onSurface, marginTop: 4 },

  // Rewards
  rewardCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
  },
  rewardIcon: { fontSize: 28 },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: 14, fontWeight: "600", color: Colors.onSurface },
  rewardPoints: { fontSize: 12, color: Colors.outline, marginTop: 2 },
  rewardBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardBtnDisabled: { backgroundColor: Colors.surfaceContainerHigh },
  rewardBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // QR
  qrCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderStyle: "dashed",
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  qrText: { fontSize: 16, fontWeight: "700", color: Colors.outline },
  qrSubtext: { fontSize: 11, color: Colors.outline, textAlign: "center", paddingHorizontal: 8 },

  // Logout
  logoutButton: {
    backgroundColor: "#fef2f2",
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
    minHeight: 56,
    justifyContent: "center",
  },
  logoutText: { color: Colors.error, fontSize: 15, fontWeight: "700" },
});
