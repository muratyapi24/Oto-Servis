"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Car,
  ChevronLeft,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("tr");

interface Conversation {
  id: string;
  lastMessage: string;
  lastMessageAt: string;
  senderName: string;
  senderType: string;
  isRead: boolean;
  serviceOrderId: string | null;
  serviceOrderNumber: number | null;
  plate: string | null;
}

interface Message {
  id: string;
  content: string;
  senderType: string;
  senderName: string;
  createdAt: string;
  isRead: boolean;
}

export default function MesajlarClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mobile/firma/mesajlar");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yüklenemedi.");
      setConversations(data.conversations ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Konuşma mesajlarını yükle
  async function loadMessages(conv: Conversation) {
    setSelectedConv(conv);
    setMsgLoading(true);
    try {
      // Servis emrine ait mesajları çek
      const url = conv.serviceOrderId
        ? `/api/mobile/firma/mesajlar?serviceOrderId=${conv.serviceOrderId}`
        : `/api/mobile/firma/mesajlar`;
      const res = await fetch(url);
      const data = await res.json();
      // Konuşmadaki mesajları filtrele
      const allMsgs = data.conversations ?? [];
      // Basit yaklaşım: tüm mesajları göster (gerçek uygulamada ayrı endpoint)
      setMessages(
        allMsgs.map((c: any) => ({
          id: c.id,
          content: c.lastMessage,
          senderType: c.senderType,
          senderName: c.senderName,
          createdAt: c.lastMessageAt,
          isRead: c.isRead,
        }))
      );
    } finally {
      setMsgLoading(false);
    }
  }

  // SSE bağlantısı
  useEffect(() => {
    if (!selectedConv) return;
    // SSE dinleyicisi — gerçek zamanlı mesaj güncellemeleri
    const tenantId = ""; // session'dan alınır, burada placeholder
    const eventSource = new EventSource(`/api/events/${tenantId}`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "NEW_MESSAGE") {
          setMessages((prev) => [...prev, data.message]);
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      } catch {
        // ignore
      }
    };
    return () => eventSource.close();
  }, [selectedConv]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;
    setSending(true);
    try {
      const res = await fetch("/api/mobile/firma/mesajlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          serviceOrderId: selectedConv.serviceOrderId ?? undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.message.id,
            content: data.message.content,
            senderType: "ADMIN",
            senderName: "Siz",
            createdAt: data.message.createdAt,
            isRead: true,
          },
        ]);
        setNewMessage("");
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } finally {
      setSending(false);
    }
  }

  // Konuşma listesi görünümü
  if (!selectedConv) {
    return (
      <div className="space-y-5 pb-8">
        <div>
          <h1 className="text-2xl font-black text-[#00236f]">Mesajlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Müşteri ve usta konuşmaları</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-500">Mesaj yok</p>
            <p className="text-sm text-gray-400">Henüz konuşma başlatılmamış.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadMessages(conv)}
                className={`w-full text-left flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm ${
                  !conv.isRead
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  {conv.plate ? (
                    <Car className="w-5 h-5 text-[#00236f]" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-[#00236f]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold truncate ${!conv.isRead ? "text-gray-900" : "text-gray-700"}`}>
                      {conv.plate
                        ? `${conv.plate} — İş #${conv.serviceOrderNumber}`
                        : conv.senderName}
                    </p>
                    <p className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {dayjs(conv.lastMessageAt).fromNow()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {!conv.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00236f] shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mesaj detay görünümü
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <button
          onClick={() => setSelectedConv(null)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {selectedConv.plate
              ? `${selectedConv.plate} — İş #${selectedConv.serviceOrderNumber}`
              : selectedConv.senderName}
          </p>
          {selectedConv.serviceOrderId && (
            <Link
              href={`/m/firma/servis-detay/${selectedConv.serviceOrderId}`}
              className="text-xs text-[#00236f] hover:underline"
            >
              Servis detayını gör →
            </Link>
          )}
        </div>
      </div>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {msgLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            Henüz mesaj yok. İlk mesajı siz gönderin.
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderType === "ADMIN";
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "bg-[#00236f] text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-[10px] font-bold text-gray-500 mb-1">{msg.senderName}</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? "text-blue-200" : "text-gray-400"}`}>
                    {dayjs(msg.createdAt).locale("tr").format("HH:mm")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj Gönderme */}
      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-gray-200">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mesaj yazın..."
          className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00236f]/30 focus:border-[#00236f] outline-none"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="w-12 h-12 bg-[#00236f] text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
