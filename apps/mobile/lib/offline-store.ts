/**
 * Offline Veri Deposu — AsyncStorage tabanlı
 * Bağlantı yokken son senkronize edilen verileri saklar
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const CACHE_PREFIX = "bst_cache_";
const SYNC_QUEUE_KEY = "bst_sync_queue";

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number; // saniye
}

/**
 * Veriyi offline cache'e yaz
 */
export async function cacheData<T>(key: string, data: T, ttlSeconds = 3600): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    ttl: ttlSeconds,
  };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
}

/**
 * Cache'den veri oku (TTL kontrolü ile)
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;

  const entry: CacheEntry<T> = JSON.parse(raw);
  const age = (Date.now() - entry.cachedAt) / 1000;

  if (age > entry.ttl) {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return null;
  }

  return entry.data;
}

/**
 * İnternet bağlantısı var mı kontrol et
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Offline'da yapılan değişiklikleri kuyruğa ekle
 */
export async function queueOfflineAction(action: {
  type: string;
  payload: unknown;
  endpoint: string;
  method: string;
}): Promise<void> {
  const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  const queue: typeof action[] = raw ? JSON.parse(raw) : [];
  queue.push({ ...action });
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Bağlantı geldiğinde kuyruktaki işlemleri senkronize et
 */
export async function syncOfflineQueue(apiUrl: string): Promise<{ synced: number; failed: number }> {
  const online = await isOnline();
  if (!online) return { synced: 0, failed: 0 };

  const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  if (!raw) return { synced: 0, failed: 0 };

  const queue: { type: string; payload: unknown; endpoint: string; method: string }[] = JSON.parse(raw);
  let synced = 0;
  let failed = 0;
  const remaining: typeof queue = [];

  for (const action of queue) {
    try {
      const res = await fetch(`${apiUrl}${action.endpoint}`, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      });

      if (res.ok) {
        synced++;
      } else {
        failed++;
        remaining.push(action);
      }
    } catch {
      failed++;
      remaining.push(action);
    }
  }

  if (remaining.length > 0) {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
  } else {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  }

  return { synced, failed };
}

/**
 * Cache key'leri
 */
export const OfflineCacheKeys = {
  musteriPanel: "musteri_panel",
  firmaPanel: "firma_panel",
  firmaKuyruk: "firma_kuyruk",
  firmaPersonel: "firma_personel",
} as const;
