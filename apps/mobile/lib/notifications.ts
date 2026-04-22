/**
 * Push Notification Servisi — Expo Notifications
 * Firebase Cloud Messaging (FCM) ile entegre çalışır
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_TOKEN_KEY = "expo_push_token";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// Bildirim gösterim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Push bildirim izni iste ve token al
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[PUSH] Fiziksel cihaz gerekli");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[PUSH] Bildirim izni reddedildi");
    return null;
  }

  // Android için notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "MS Oto Servis",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1e40af",
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: "bst-oto-servis",
  })).data;

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  return token;
}

/**
 * Push token'ı sunucuya kaydet
 */
export async function syncPushToken(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: token,
        keys: { p256dh: "expo", auth: "expo" },
      }),
    });
  } catch {
    console.warn("[PUSH] Token senkronizasyonu başarısız");
  }
}

/**
 * Bildirim dinleyicisi kur
 */
export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const notifSub = Notifications.addNotificationReceivedListener(onNotification);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    notifSub.remove();
    responseSub.remove();
  };
}
