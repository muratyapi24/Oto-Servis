import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface Notification {
  id: string;
  type: "servis" | "stok" | "onay";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "servis",
    title: "Servis Tamamlandı",
    body: "34 ABC 123 plakalı araç servisi tamamlandı. Müşteri bilgilendirildi.",
    time: "10 dk önce",
    read: false,
  },
  {
    id: "2",
    type: "onay",
    title: "Onay Bekliyor",
    body: "06 XYZ 456 plakalı araç için ₺2.400 tutarında fiyat teklifi onay bekliyor.",
    time: "35 dk önce",
    read: false,
  },
  {
    id: "3",
    type: "stok",
    title: "Kritik Stok Uyarısı",
    body: "Yağ filtresi stoğu minimum seviyenin altına düştü. Mevcut: 2 adet.",
    time: "1 saat önce",
    read: false,
  },
  {
    id: "4",
    type: "servis",
    title: "Yeni Servis Talebi",
    body: "41 DEF 789 plakalı araç için yeni servis talebi oluşturuldu.",
    time: "2 saat önce",
    read: true,
  },
  {
    id: "5",
    type: "stok",
    title: "Parça Talebi Onaylandı",
    body: "Fren balatası parça talebiniz onaylandı ve depoya eklendi.",
    time: "3 saat önce",
    read: true,
  },
];

const TYPE_ICON: Record<Notification["type"], string> = {
  servis: "🔧",
  stok: "📦",
  onay: "✅",
};

export default function BildirimlerScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const allRead = unreadCount === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Bildirimler" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Mark all read button */}
        {!allRead && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllAsRead}
            activeOpacity={0.8}
          >
            <Text style={styles.markAllText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}

        {/* Empty state */}
        {notifications.length === 0 || allRead ? (
          allRead && notifications.length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Tüm bildirimler okundu</Text>
              <Text style={styles.emptyBody}>Yeni bildirim geldiğinde burada görünecek.</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Bildirim yok</Text>
              <Text style={styles.emptyBody}>Henüz bir bildiriminiz bulunmuyor.</Text>
            </View>
          )
        ) : null}

        {/* Notification list */}
        {notifications.map((notif) => (
          <TouchableOpacity
            key={notif.id}
            style={[styles.card, Shadow.navy, notif.read && styles.cardRead]}
            onPress={() => markAsRead(notif.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrap, notif.read && styles.iconWrapRead]}>
                <Text style={styles.icon}>{TYPE_ICON[notif.type]}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, notif.read && styles.cardTitleRead]}>
                  {notif.title}
                </Text>
                {!notif.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardBody} numberOfLines={2}>
                {notif.body}
              </Text>
              <Text style={styles.cardTime}>{notif.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 10, paddingBottom: 32 },

  markAllBtn: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    marginBottom: 4,
    minHeight: 48,
    justifyContent: "center",
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryContainer,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 10,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  cardRead: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  cardLeft: {
    paddingTop: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapRead: {
    backgroundColor: Colors.surfaceContainer,
  },
  icon: { fontSize: 20 },

  cardContent: { flex: 1, gap: 4 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.onSurface,
    flex: 1,
  },
  cardTitleRead: {
    fontWeight: "500",
    color: Colors.outline,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
  cardBody: {
    fontSize: 13,
    color: Colors.outline,
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    color: Colors.outlineVariant,
    marginTop: 2,
  },
});
