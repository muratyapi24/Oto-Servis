"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";

// Bu sayfa client component olacak çünkü mesaj gönderme interaktif
// Server actions istemci tarafından çağrılacak

interface Message {
  id: string;
  senderType: string;
  senderName: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string | Date;
}

interface Conversation {
  serviceOrder: any;
  mechanic: any;
  vehicle: any;
  messages: Message[];
  unreadCount: number;
  lastMessage: Message | null;
}

export default function MusteriMesajlarPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Konuşmaları yükle
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const { getMusteriMesajlari } = await import("@/lib/actions/musteri-mesaj.actions");
      const result = await getMusteriMesajlari();
      if (result.success && result.conversations) {
        setConversations(result.conversations);
        if (result.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(result.conversations[0]?.serviceOrder?.id ?? null);
        }
      }
    } catch (error) {
      console.error("Mesajlar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const { sendMusteriMesaj } = await import("@/lib/actions/musteri-mesaj.actions");
      const result = await sendMusteriMesaj(selectedConversation, newMessage.trim());
      if (result.success) {
        setNewMessage("");
        await loadConversations();
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
    } finally {
      setSending(false);
    }
  }

  const activeConversation = conversations.find(c => c.serviceOrder.id === selectedConversation);
  const activeMessages = activeConversation?.messages || [];

  // Mesajlar yüklenince en alta scroll
  useEffect(() => {
    if (activeMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation, activeMessages.length]);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant mt-4 font-medium">Mesajlar yükleniyor...</p>
      </main>
    );
  }

  // Konuşma yoksa boş durum
  if (conversations.length === 0) {
    return (
      <main className="px-6 pt-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">chat</span>
        </div>
        <h2 className="text-lg font-extrabold text-on-surface mb-2">Mesaj Yok</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed px-4 mb-6">
          Aktif servis kaydınız olduğunda ustanızla mesajlaşabilirsiniz.
        </p>
        <Link href="/m/musteri/panel" className="bg-primary text-white font-bold py-3 px-6 rounded-xl active:scale-95 transition-transform">
          Panele Dön
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto">
      {/* Konuşma Seçici (Eğer birden fazla varsa) */}
      {conversations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 py-3 border-b border-outline-variant/10 bg-surface-container-lowest/50 backdrop-blur-sm">
          {conversations.map(conv => (
            <button
              key={conv.serviceOrder.id}
              onClick={() => setSelectedConversation(conv.serviceOrder.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                selectedConversation === conv.serviceOrder.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-sm">directions_car</span>
              {conv.vehicle?.plate || "Araç"}
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 bg-error text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Usta Bilgi Başlığı */}
      {activeConversation && (
        <div className="px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-on-surface text-[14px] truncate">
              {activeConversation.mechanic
                ? `${activeConversation.mechanic.firstName} ${activeConversation.mechanic.lastName}`
                : "Servis Ekibi"}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {activeConversation.vehicle?.plate} • İş Emri #{activeConversation.serviceOrder.orderNumber}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-primary-fixed text-primary px-2 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-bold uppercase">Aktif</span>
          </div>
        </div>
      )}

      {/* Mesaj Alanı */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-surface">
        {/* Sistem Mesajı - Başlangıç */}
        <div className="text-center py-3">
          <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-full">
            Konuşma başladı
          </span>
        </div>

        {activeMessages.map((msg) => {
          const isCustomer = msg.senderType === "CUSTOMER";
          const isSystem = msg.messageType === "SYSTEM";

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="bg-surface-container text-on-surface-variant text-[10px] font-medium px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isCustomer ? 'order-1' : 'order-2'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  isCustomer
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-surface-container-lowest text-on-surface rounded-bl-md'
                }`}>
                  {!isCustomer && (
                    <p className="text-[10px] font-bold text-secondary mb-1">{msg.senderName}</p>
                  )}
                  <p className="text-[13px] leading-relaxed">{msg.content}</p>
                </div>
                <p className={`text-[9px] text-on-surface-variant/60 mt-1 ${isCustomer ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  {isCustomer && msg.isRead && (
                    <span className="ml-1 text-primary">✓✓</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {activeMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">chat_bubble</span>
            <p className="text-[12px] text-on-surface-variant">Henüz mesaj yok. Bir mesaj göndererek başlayın.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj Gönderme Alanı */}
      <div className="px-4 py-3 bg-surface-container-lowest border-t border-outline-variant/10 flex items-end gap-2">
        <div className="flex-1 bg-surface-container rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Mesajınızı yazın..."
            className="flex-1 bg-transparent text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant/50"
            disabled={sending}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0 ${
            newMessage.trim() && !sending
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-surface-container text-on-surface-variant/40'
          }`}
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          )}
        </button>
      </div>
    </main>
  );
}
