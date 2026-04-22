import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { MechanicAvatar } from "@/components/MechanicAvatar";
import { Colors, Radius, Shadow } from "@/constants/theme";

const DAYS: { key: string; label: string }[] = [
  { key: "MON", label: "Pzt" },
  { key: "TUE", label: "Sal" },
  { key: "WED", label: "Çar" },
  { key: "THU", label: "Per" },
  { key: "FRI", label: "Cum" },
  { key: "SAT", label: "Cmt" },
  { key: "SUN", label: "Paz" },
];

// Distinct colors for work-day cells (cycling through palette)
const SHIFT_COLORS = [
  Colors.primaryContainer,
  Colors.secondary,
  "#7c3aed",
  "#b45309",
  "#0891b2",
  "#be185d",
  "#15803d",
];

export default function VardiyaScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["firma-personel"],
    queryFn: () => api.firmaPersonel() as Promise<any>,
  });

  const personel: any[] = data?.personel ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Vardiya Takvimi" onBack={() => router.back()} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {personel.length === 0 ? (
            <View style={[styles.emptyCard, Shadow.navy]}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>Personel bulunamadı</Text>
            </View>
          ) : (
            <View style={[styles.calendarCard, Shadow.navy]}>
              {/* Days of week header */}
              <View style={styles.headerRow}>
                {/* Name column spacer */}
                <View style={styles.nameCol} />
                {DAYS.map((d) => (
                  <View key={d.key} style={styles.dayHeaderCell}>
                    <Text style={styles.dayHeaderText}>{d.label}</Text>
                  </View>
                ))}
              </View>

              {/* Mechanic rows */}
              {personel.map((p: any, index: number) => {
                const workDays: string[] = p.workDays ?? [];
                const shiftColor = SHIFT_COLORS[index % SHIFT_COLORS.length];

                return (
                  <View
                    key={p.id}
                    style={[
                      styles.mechanicRow,
                      index < personel.length - 1 && styles.mechanicRowBorder,
                    ]}
                  >
                    {/* Name + avatar */}
                    <View style={styles.nameCol}>
                      <MechanicAvatar
                        avatarUrl={p.avatarUrl}
                        firstName={p.firstName ?? "?"}
                        lastName={p.lastName ?? "?"}
                        size={28}
                      />
                      <Text style={styles.mechanicName} numberOfLines={1}>
                        {p.firstName ?? ""}
                      </Text>
                    </View>

                    {/* Day cells */}
                    {DAYS.map((d) => {
                      const isWorkDay = workDays.includes(d.key);
                      const hasShift = !!(p.shiftStart && p.shiftEnd);

                      return (
                        <View key={d.key} style={styles.dayCell}>
                          {isWorkDay ? (
                            hasShift ? (
                              <View
                                style={[
                                  styles.shiftCell,
                                  { backgroundColor: shiftColor + "22" },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.shiftTime,
                                    { color: shiftColor },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {p.shiftStart}
                                </Text>
                                <Text
                                  style={[
                                    styles.shiftTime,
                                    { color: shiftColor },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {p.shiftEnd}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.dotCell}>
                                <View
                                  style={[
                                    styles.dot,
                                    { backgroundColor: shiftColor },
                                  ]}
                                />
                              </View>
                            )
                          ) : (
                            <View style={styles.emptyDayCell} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
              <Text style={styles.legendText}>Çalışma günü</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.surfaceContainerHigh }]} />
              <Text style={styles.legendText}>İzin günü</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const NAME_COL_WIDTH = 72;
const DAY_CELL_WIDTH = 44;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  calendarCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  nameCol: {
    width: NAME_COL_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
  },
  dayHeaderCell: {
    width: DAY_CELL_WIDTH,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.outline,
    textTransform: "uppercase",
  },

  mechanicRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 56,
  },
  mechanicRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLow,
  },
  mechanicName: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.onSurface,
    flex: 1,
  },

  dayCell: {
    width: DAY_CELL_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  shiftCell: {
    borderRadius: Radius.sm,
    paddingHorizontal: 2,
    paddingVertical: 3,
    alignItems: "center",
    width: 40,
    gap: 1,
  },
  shiftTime: {
    fontSize: 9,
    fontWeight: "700",
  },
  dotCell: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyDayCell: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerLow,
  },

  legend: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.outline,
  },

  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: {
    fontSize: 14,
    color: Colors.outline,
  },
});
