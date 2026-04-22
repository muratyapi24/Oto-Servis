import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { MechanicAvatar } from "@/components/MechanicAvatar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

// ─── Timeline ────────────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Bekliyor" },
  { key: "IN_PROGRESS", label: "Devam Ediyor" },
  { key: "COMPLETED", label: "Tamamlandı" },
];

function getStepIndex(status: string): number {
  if (status === "COMPLETED" || status === "CANCELLED") return 2;
  if (status === "IN_PROGRESS" || status === "WAITING_APPROVAL") return 1;
  return 0;
}

function TimelineBar({ status }: { status: string }) {
  const activeIdx = getStepIndex(status);
  return (
    <View style={tlStyles.container}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <View key={step.key} style={tlStyles.stepRow}>
            <View style={tlStyles.dotCol}>
              <View
                style={[
                  tlStyles.dot,
                  done && tlStyles.dotDone,
                  active && tlStyles.dotActive,
                ]}
              >
                {done && <Text style={tlStyles.check}>✓</Text>}
              </View>
              {idx < TIMELINE_STEPS.length - 1 && (
                <View style={[tlStyles.line, done && tlStyles.lineDone]} />
              )}
            </View>
            <Text
              style={[
                tlStyles.label,
                active && tlStyles.labelActive,
                done && tlStyles.labelDone,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const tlStyles = StyleSheet.create({
  container: { gap: 0, paddingVertical: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dotCol: { alignItems: "center", width: 20 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
  },
  dotDone: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  dotActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primaryContainer },
  check: { color: "#fff", fontSize: 10, fontWeight: "800" },
  line: { width: 2, height: 20, backgroundColor: Colors.surfaceContainerHigh, marginVertical: 2 },
  lineDone: { backgroundColor: Colors.secondary },
  label: { fontSize: 12, color: Colors.outline, paddingTop: 2 },
  labelActive: { color: Colors.primaryContainer, fontWeight: "700" },
  labelDone: { color: Colors.secondary, fontWeight: "600" },
});

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRow({
  rating,
  onSelect,
  readonly = false,
}: {
  rating: number;
  onSelect?: (r: number) => void;
  readonly?: boolean;
}) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onSelect?.(star)}
          disabled={readonly}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={starStyles.starBtn}
        >
          <Text style={[starStyles.star, star <= rating && starStyles.starFilled]}>
            {star <= rating ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 4 },
  starBtn: { width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  star: { fontSize: 28, color: Colors.outlineVariant },
  starFilled: { color: "#f59e0b" },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MusteriServisDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["musteri-servis", id],
    queryFn: () => api.musteriServisDetay(id) as Promise<any>,
    enabled: !!id,
  });

  const ratingMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      api.musteriServisRating(id, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musteri-servis", id] });
      Alert.alert("Teşekkürler!", "Değerlendirmeniz kaydedildi.");
    },
    onError: (err: any) =>
      Alert.alert("Hata", err?.message ?? "Değerlendirme gönderilemedi."),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  if (error || !data?.order) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Servis Detayı" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Servis bilgisi yüklenemedi</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { order } = data;
  const isCompleted = order.status === "COMPLETED";
  const hasRating = !!order.serviceRating;
  const mechanic = order.assignedMechanic;
  const vehicle = order.vehicle;
  const documents: any[] = order.documents ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Servis Detayı" onBack={() => router.back()} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Info */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.sectionLabel}>ARAÇ BİLGİLERİ</Text>
          <Text style={styles.plate}>{vehicle?.plate}</Text>
          <Text style={styles.vehicleModel}>
            {vehicle?.brand} {vehicle?.model}
          </Text>
          {vehicle?.year && (
            <Text style={styles.vehicleYear}>{vehicle.year}</Text>
          )}
        </View>

        {/* Service Info */}
        <View style={[styles.card, Shadow.navy]}>
          <View style={styles.cardRow}>
            <Text style={styles.sectionLabel}>SERVİS TÜRÜ</Text>
            <StatusBadge status={order.status} />
          </View>
          {order.serviceType && (
            <Text style={styles.serviceType}>{order.serviceType}</Text>
          )}
          <Text style={styles.complaint}>{order.complaintDescription}</Text>
        </View>

        {/* Mechanic */}
        {mechanic && (
          <View style={[styles.card, Shadow.navy]}>
            <Text style={styles.sectionLabel}>ATANAN USTA</Text>
            <View style={styles.mechanicRow}>
              <MechanicAvatar
                avatarUrl={mechanic.avatarUrl}
                firstName={mechanic.firstName}
                lastName={mechanic.lastName}
                size={44}
              />
              <View style={styles.mechanicInfo}>
                <Text style={styles.mechanicName}>
                  {mechanic.firstName} {mechanic.lastName}
                </Text>
                {mechanic.specialty && (
                  <Text style={styles.mechanicSpecialty}>{mechanic.specialty}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.sectionLabel}>SERVİS DURUMU</Text>
          <TimelineBar status={order.status} />
        </View>

        {/* Progress */}
        <View style={[styles.card, Shadow.navy]}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionLabel}>TAMAMLANMA</Text>
            <Text style={styles.progressPct}>{order.completionPercentage ?? 0}%</Text>
          </View>
          <ProgressBar value={order.completionPercentage ?? 0} height={8} />
        </View>

        {/* Documents */}
        <View style={[styles.card, Shadow.navy]}>
          <Text style={styles.sectionLabel}>BELGELER</Text>
          {documents.length === 0 ? (
            <Text style={styles.emptyText}>Belge yok</Text>
          ) : (
            documents.map((doc: any, idx: number) => (
              <View key={doc.id ?? idx} style={styles.docRow}>
                <Text style={styles.docIcon}>📄</Text>
                <Text style={styles.docName} numberOfLines={1}>
                  {doc.fileName ?? doc.name ?? "Belge"}
                </Text>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.downloadBtn}
                  onPress={() => Alert.alert("İndir", doc.url ?? "URL bulunamadı")}
                >
                  <Text style={styles.downloadIcon}>⬇</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Rating Section */}
        {isCompleted && (
          <View style={[styles.card, Shadow.navy]}>
            <Text style={styles.sectionLabel}>DEĞERLENDİRME</Text>
            {hasRating ? (
              <>
                <Text style={styles.ratingDoneText}>Değerlendirdiniz</Text>
                <StarRow rating={order.serviceRating.rating} readonly />
                {order.serviceRating.comment ? (
                  <Text style={styles.ratingComment}>{order.serviceRating.comment}</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.ratingPrompt}>Bu servisi nasıl buldunuz?</Text>
                <StarRow rating={selectedRating} onSelect={setSelectedRating} />
                <PrimaryButton
                  label="Değerlendir"
                  onPress={() => {
                    if (selectedRating === 0) {
                      Alert.alert("Uyarı", "Lütfen bir puan seçin.");
                      return;
                    }
                    ratingMutation.mutate({ rating: selectedRating });
                  }}
                  loading={ratingMutation.isPending}
                  disabled={selectedRating === 0}
                  size="md"
                />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 16, color: Colors.error },
  retryBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    minHeight: 48,
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontWeight: "600" },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // Vehicle
  plate: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 2,
  },
  vehicleModel: { fontSize: 15, color: Colors.onSurface, fontWeight: "600" },
  vehicleYear: { fontSize: 13, color: Colors.outline },

  // Service
  serviceType: { fontSize: 15, fontWeight: "700", color: Colors.onSurface },
  complaint: { fontSize: 13, color: Colors.onSurface, lineHeight: 20 },

  // Mechanic
  mechanicRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  mechanicInfo: { flex: 1, gap: 2 },
  mechanicName: { fontSize: 15, fontWeight: "700", color: Colors.onSurface },
  mechanicSpecialty: { fontSize: 12, color: Colors.outline },

  // Progress
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressPct: { fontSize: 14, fontWeight: "700", color: Colors.primaryContainer },

  // Documents
  emptyText: { fontSize: 13, color: Colors.outline },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    minHeight: 48,
  },
  docIcon: { fontSize: 18 },
  docName: { flex: 1, fontSize: 13, color: Colors.onSurface },
  downloadBtn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.sm,
  },
  downloadIcon: { fontSize: 16, color: Colors.primaryContainer },

  // Rating
  ratingDoneText: { fontSize: 13, color: Colors.secondary, fontWeight: "600" },
  ratingPrompt: { fontSize: 14, color: Colors.onSurface },
  ratingComment: { fontSize: 13, color: Colors.outline, fontStyle: "italic" },
});
