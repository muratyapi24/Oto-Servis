import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { api } from "@/lib/api";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

const STATUS_CONFIG: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: Colors.surfaceContainerLow, text: Colors.outline, label: "Taslak" },
  SENT:      { bg: "#dbeafe", text: Colors.primaryContainer, label: "Gönderildi" },
  PAID:      { bg: "#d1fae5", text: Colors.secondary, label: "Ödendi" },
  CANCELLED: { bg: "#fee2e2", text: Colors.error, label: "İptal" },
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  LABOR: "İşçilik",
  PART: "Parça",
  SERVICE: "Hizmet",
};

export default function FaturaDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["fatura-detay", id],
    queryFn: () => api.firmaFaturaDetay(id as string) as Promise<any>,
    enabled: !!id,
  });

  const invoice = data?.invoice;

  const handleDownloadPdf = async () => {
    if (!id) return;
    setDownloadingPdf(true);
    try {
      const res = await api.firmaFaturaPdf(id as string) as any;
      if (res?.url) {
        await Linking.openURL(res.url);
      } else {
        Alert.alert("Bilgi", "PDF henüz hazırlanıyor, lütfen kısa süre sonra tekrar deneyin.");
      }
    } catch {
      Alert.alert("Hata", "PDF indirilemedi.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  if (error || !invoice) {
    // Fallback: placeholder göster
    const invoiceNumber = `FTR-${(id ?? "000").toString().slice(-6).toUpperCase()}`;
    const status: InvoiceStatus = "DRAFT";
    const statusConfig = STATUS_CONFIG[status];
    const fmt = (v: number) => `₺${v.toLocaleString("tr-TR")}`;

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Fatura Detayı" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, Shadow.navy]}>
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceNumberBlock}>
                <Text style={styles.invoiceLabel}>FATURA NO</Text>
                <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const status = (invoice.status ?? "DRAFT") as InvoiceStatus;
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const fmt = (v: number | string) => `₺${Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;

  const customerName = invoice.customer?.companyName ||
    [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(" ") ||
    "Müşteri";

  const items = invoice.items ?? [];
  const payments = invoice.payments ?? [];

  const handleSend = () => {
    Alert.alert("Bilgi", "Fatura gönderme işlemi web uygulamasından yapılabilir.");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Fatura Detayı" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Invoice Header */}
        <View style={[styles.card, Shadow.navy]}>
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceNumberBlock}>
              <Text style={styles.invoiceLabel}>FATURA NO</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber ?? "TASLAK"}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.invoiceDate}>
            Tarih:{" "}
            {new Date(invoice.issueDate).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          {invoice.dueDate && (
            <Text style={styles.refNote}>
              Vade: {new Date(invoice.dueDate).toLocaleDateString("tr-TR")}
            </Text>
          )}
        </View>

        {/* Customer Info */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
          <Text style={styles.customerName}>{customerName}</Text>
          {invoice.customer?.phone && (
            <Text style={styles.customerDetail}>Telefon: {invoice.customer.phone}</Text>
          )}
          {invoice.customer?.address && (
            <Text style={styles.customerDetail}>Adres: {invoice.customer.address}</Text>
          )}
        </View>

        {/* Line Items */}
        {items.length > 0 && (
          <View style={[styles.card, Shadow.navy]}>
            <Text style={styles.sectionTitle}>Kalemler ({items.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableDesc]}>Açıklama</Text>
              <Text style={[styles.tableCell, styles.tableQty]}>Adet</Text>
              <Text style={[styles.tableCell, styles.tablePrice]}>Tutar</Text>
            </View>
            <View style={styles.tableDivider} />
            {items.map((item: any, idx: number) => (
              <View key={item.id ?? idx} style={styles.tableRow}>
                <View style={styles.tableDescView}>
                  <Text style={{ fontSize: 13, color: Colors.onSurface, fontWeight: "500" }} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.outline }}>
                    {ITEM_TYPE_LABELS[item.type] ?? item.type}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.tableQty]}>{Number(item.quantity)}</Text>
                <Text style={[styles.tableCell, styles.tablePrice]}>{fmt(item.lineTotal)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={[styles.card, Shadow.navy]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ara Toplam</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>KDV</Text>
            <Text style={styles.totalValue}>{fmt(invoice.taxAmount)}</Text>
          </View>
          <View style={styles.tableDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Genel Toplam</Text>
            <Text style={styles.grandValue}>{fmt(invoice.totalAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ödenen</Text>
            <Text style={[styles.totalValue, { color: Colors.secondary }]}>
              {fmt(invoice.paidAmount)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Kalan Bakiye</Text>
            <Text style={[styles.totalValue, {
              color: Number(invoice.paidAmount) >= Number(invoice.totalAmount) ? Colors.secondary : Colors.error
            }]}>
              {fmt(Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount)))}
            </Text>
          </View>
        </View>

        {/* Ödeme Geçmişi */}
        {payments.length > 0 && (
          <View style={[styles.card, Shadow.navy]}>
            <Text style={styles.sectionTitle}>Ödeme Geçmişi</Text>
            {payments.map((payment: any) => (
              <View key={payment.id} style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {new Date(payment.paymentDate).toLocaleDateString("tr-TR")}
                </Text>
                <Text style={[styles.totalValue, { color: Colors.secondary }]}>
                  {fmt(payment.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* PDF İndir */}
        {invoice.pdfUrl && (
          <PrimaryButton
            label={downloadingPdf ? "İndiriliyor..." : "PDF İndir"}
            onPress={handleDownloadPdf}
            loading={downloadingPdf}
            size="lg"
            variant="outline"
          />
        )}

        {status === "DRAFT" && (
          <PrimaryButton
            label="Faturayı Gönder"
            onPress={handleSend}
            size="lg"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },

  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceNumberBlock: { gap: 2 },
  invoiceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.xl,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  invoiceDate: {
    fontSize: 13,
    color: Colors.outline,
  },
  refNote: {
    fontSize: 11,
    color: Colors.outlineVariant,
    fontFamily: "monospace",
  },

  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  customerDetail: {
    fontSize: 13,
    color: Colors.outline,
  },

  tableHeader: {
    flexDirection: "row",
    paddingBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  tableCell: {
    fontSize: 13,
    color: Colors.onSurface,
  },
  tableDesc: { flex: 1, fontWeight: "500" },
  tableDescView: { flex: 1 },
  tableQty: { width: 40, textAlign: "center", color: Colors.outline },
  tablePrice: { width: 80, textAlign: "right", fontWeight: "600" },
  tableDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  grandValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.onSurface,
  },
});
