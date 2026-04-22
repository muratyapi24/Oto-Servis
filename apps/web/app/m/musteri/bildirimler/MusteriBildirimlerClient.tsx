"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Loader2, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("tr");

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function MusteriBildirimlerClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/musteri/bildirimler");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yüklenemedi.");
      setNotifications(data.notifications ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await fetch(`/api/musteri/bildirimler/${id}/oku`, { method: "PATCH" });
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/musteri/bildirimler", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00236f]">Bildirimler</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-bold text-[#00236f]">{unreadCount}</span> okunmamış
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Bell className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-500">Bildirim yok</p>
          <p className="text-sm text-gray-400">Yeni bildirimler burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={`w-full text-left flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                n.isRead ? "bg-white border-gray-200 opacity-70" : "bg-blue-50/50 border-blue-200 hover:bg-blue-50"
              }`}
            >
              <div className="mt-1 shrink-0">
                {n.isRead ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00236f] animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${n.isRead ? "text-gray-600" : "text-gray-900"}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1.5">{dayjs(n.createdAt).fromNow()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
