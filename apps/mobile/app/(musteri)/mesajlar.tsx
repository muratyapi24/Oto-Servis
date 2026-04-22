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
import { MechanicAvatar } from "@/components/MechanicAvatar";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface Thread {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

const MOCK_THREADS: Thread[] = [
  {
    id: "1",
    firstName: "Ahmet",
    lastName: "Yılmaz",
    role: "Usta",
    lastMessage: "Aracınızın fren balatası değişimi tamamlandı.",
    time: "11:20",
    unreadCount: 2,
  },
  {
    id: "2",
    firstName: "Mehmet",
    lastName: "Kaya",
    role: "Usta",
    lastMessage: "Yağ değişimi için randevunuz onaylandı.",
    time: "09:45",
    unreadCount: 1,
  },
  {
    id: "3",
    firstName: "Fatma",
    lastName: "Demir",
    role: "Servis",
    lastMessage: "Aracınız hazır, teslim alabilirsiniz.",
    time: "Dün",
    unreadCount: 0,
  },
  {
    id: "4",
    firstName: "Ali",
    lastName: "Çelik",
    role: "Usta",
    lastMessage: "Parça siparişi verildi, 2 gün içinde gelecek.",
    time: "Dün",
    unreadCount: 0,
  },
];

function handleThreadPress() {
  Alert.alert("Yakında", "Mesajlaşma özelliği yakında aktif olacak.", [
    { text: "Tamam" },
  ]);
}

export default function MesajlarScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Mesajlar" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_THREADS.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Mesaj yok</Text>
            <Text style={styles.emptyBody}>
              Henüz bir konuşmanız bulunmuyor.
            </Text>
          </View>
        ) : (
          MOCK_THREADS.map((thread) => (
            <TouchableOpacity
              key={thread.id}
              style={[styles.card, Shadow.navy]}
              onPress={handleThreadPress}
              activeOpacity={0.85}
            >
              <View style={styles.avatarWrap}>
                <MechanicAvatar
                  firstName={thread.firstName}
                  lastName={thread.lastName}
                  size={48}
                />
                {thread.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{thread.unreadCount}</Text>
                  </View>
                )}
              </View>

              <View style={styles.threadContent}>
                <View style={styles.threadHeader}>
                  <Text style={styles.threadName}>
                    {thread.firstName} {thread.lastName}
                  </Text>
                  <Text style={styles.threadTime}>{thread.time}</Text>
                </View>
                <Text style={styles.threadRole}>{thread.role}</Text>
                <Text
                  style={[
                    styles.threadLastMsg,
                    thread.unreadCount > 0 && styles.threadLastMsgUnread,
                  ]}
                  numberOfLines={1}
                >
                  {thread.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 10, paddingBottom: 32 },

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
    alignItems: "center",
    gap: 12,
  },

  avatarWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  threadContent: { flex: 1, gap: 2 },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threadName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  threadTime: {
    fontSize: 11,
    color: Colors.outline,
  },
  threadRole: {
    fontSize: 11,
    color: Colors.primaryContainer,
    fontWeight: "600",
  },
  threadLastMsg: {
    fontSize: 13,
    color: Colors.outline,
    marginTop: 2,
  },
  threadLastMsgUnread: {
    color: Colors.onSurface,
    fontWeight: "600",
  },
});
