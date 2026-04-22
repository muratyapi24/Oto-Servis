import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassHeader } from "@/components/GlassHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Colors, Radius, Shadow } from "@/constants/theme";

interface PartResult {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  unit?: string;
  sellingPrice?: number;
}

type ScreenState = "scanning" | "loading" | "found" | "not_found" | "success";

export default function BarkodScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>("scanning");
  const [result, setResult] = useState<PartResult | null>(null);
  const [quantity, setQuantity] = useState("1");

  const stockMutation = useMutation({
    mutationFn: () =>
      api.firmaStokGuncelle(result!.id, {
        quantity: Number(quantity),
        type: "IN",
        reason: "Barkod ile Hızlı Stok Girişi",
      }) as Promise<any>,
    onSuccess: () => {
      setScreenState("success");
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message ?? "Stok güncellenemedi.");
    },
  });

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (screenState !== "scanning") return;
    setScreenState("loading");
    setResult(null);

    try {
      const res = await api.firmaBarkodAra(data) as any;
      const part: PartResult | null = res?.part ?? res?.data ?? null;
      if (part && part.id) {
        setResult(part);
        setQuantity("1");
        setScreenState("found");
      } else {
        setScreenState("not_found");
      }
    } catch {
      setScreenState("not_found");
    }
  }

  function handleRescan() {
    setScreenState("scanning");
    setResult(null);
    setQuantity("1");
  }

  function handleQuantityChange(val: string) {
    // Sadece pozitif tam sayı kabul et
    const cleaned = val.replace(/[^0-9]/g, "");
    setQuantity(cleaned === "" ? "" : String(Math.max(1, parseInt(cleaned, 10))));
  }

  function handleDecrement() {
    const current = parseInt(quantity, 10) || 1;
    if (current > 1) setQuantity(String(current - 1));
  }

  function handleIncrement() {
    const current = parseInt(quantity, 10) || 1;
    setQuantity(String(current + 1));
  }

  function handleStokEkle() {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      Alert.alert("Hata", "Geçerli bir miktar girin.");
      return;
    }
    stockMutation.mutate();
  }

  // Permission loading
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Barkod Tara" onBack={() => router.back()} />
        <View style={styles.permissionScreen}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permDesc}>
            Barkod taramak için kamera erişimine ihtiyaç var.
          </Text>
          <PrimaryButton
            label="İzin Ver"
            onPress={async () => {
              const res = await requestPermission();
              if (!res.granted && !res.canAskAgain) {
                Linking.openSettings();
              }
            }}
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="Barkod Tara" onBack={() => router.back()} />

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={screenState === "scanning" ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"] }}
        >
          {/* Scan overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanHint}>
              {screenState === "scanning"
                ? "Barkodu çerçeve içine alın"
                : "Tarama duraklatıldı"}
            </Text>
          </View>
        </CameraView>
      </View>

      {/* Result area */}
      <View style={styles.resultArea}>
        {/* Loading */}
        {screenState === "loading" && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primaryContainer} />
            <Text style={styles.loadingText}>Parça aranıyor...</Text>
          </View>
        )}

        {/* Idle / scanning */}
        {screenState === "scanning" && (
          <View style={styles.idleBox}>
            <Text style={styles.idleText}>Barkod bekleniyor...</Text>
          </View>
        )}

        {/* Part found — show card + quantity input */}
        {screenState === "found" && result && (
          <View style={[styles.resultCard, Shadow.navy]}>
            {/* Part info */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultName}>{result.name}</Text>
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>Stok: {result.currentStock}</Text>
              </View>
            </View>
            {result.partNumber ? (
              <Text style={styles.partNumber}>#{result.partNumber}</Text>
            ) : null}
            {result.sellingPrice != null && (
              <Text style={styles.priceText}>
                Birim Fiyat:{" "}
                <Text style={styles.priceValue}>
                  {result.sellingPrice.toLocaleString("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  })}
                </Text>
              </Text>
            )}

            {/* Quantity selector */}
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Eklenecek Miktar</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={handleDecrement}
                  accessibilityLabel="Miktarı azalt"
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={quantity}
                  onChangeText={handleQuantityChange}
                  keyboardType="numeric"
                  textAlign="center"
                  accessibilityLabel="Miktar"
                />
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={handleIncrement}
                  accessibilityLabel="Miktarı artır"
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.resultActions}>
              <PrimaryButton
                label="Stok Ekle"
                onPress={handleStokEkle}
                loading={stockMutation.isPending}
                size="md"
              />
              <PrimaryButton
                label="Tekrar Tara"
                onPress={handleRescan}
                size="md"
                variant="outline"
              />
            </View>
          </View>
        )}

        {/* Success state */}
        {screenState === "success" && result && (
          <View style={[styles.resultCard, Shadow.navy]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Stok Güncellendi!</Text>
            <Text style={styles.successDesc}>
              <Text style={styles.successBold}>{result.name}</Text> için{" "}
              <Text style={styles.successBold}>{quantity} adet</Text> stok girişi yapıldı.
            </Text>
            <View style={styles.resultActions}>
              <PrimaryButton
                label="Yeni Tarama"
                onPress={handleRescan}
                size="md"
              />
              <PrimaryButton
                label="Stok Sayfası"
                onPress={() => router.push("/(firma)/stok" as any)}
                size="md"
                variant="outline"
              />
            </View>
          </View>
        )}

        {/* Not found */}
        {screenState === "not_found" && (
          <View style={[styles.resultCard, Shadow.navy]}>
            <Text style={styles.notFoundIcon}>🔍</Text>
            <Text style={styles.notFoundText}>Parça bulunamadı</Text>
            <Text style={styles.notFoundSub}>
              Barkod sistemde kayıtlı değil
            </Text>
            <View style={styles.resultActions}>
              <PrimaryButton
                label="Tekrar Tara"
                onPress={handleRescan}
                size="md"
              />
              <PrimaryButton
                label="Stok Sayfasına Git"
                onPress={() => router.push("/(firma)/stok" as any)}
                size="md"
                variant="outline"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.onSurface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  permissionScreen: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  permIcon: { fontSize: 56 },
  permTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.onSurface,
    textAlign: "center",
  },
  permDesc: {
    fontSize: 14,
    color: Colors.outline,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },

  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  scanFrame: {
    width: 220,
    height: 220,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scanHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  resultArea: {
    backgroundColor: Colors.surface,
    minHeight: 160,
    padding: 16,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.outline,
  },
  idleBox: {
    alignItems: "center",
    paddingVertical: 24,
  },
  idleText: {
    fontSize: 14,
    color: Colors.outline,
  },

  resultCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 8,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  resultName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  stockBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.secondary,
  },
  partNumber: {
    fontSize: 13,
    color: Colors.outline,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 13,
    color: Colors.outline,
  },
  priceValue: {
    fontWeight: "700",
    color: Colors.onSurface,
  },

  // Quantity control
  quantityRow: {
    marginTop: 4,
    gap: 8,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.secondary,
    lineHeight: 26,
  },
  qtyInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: Colors.outline,
    paddingHorizontal: 8,
  },

  resultActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  // Success state
  successIcon: { fontSize: 32, textAlign: "center" },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
    textAlign: "center",
  },
  successDesc: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
    lineHeight: 18,
  },
  successBold: {
    fontWeight: "700",
    color: Colors.onSurface,
  },

  // Not found state
  notFoundIcon: { fontSize: 32, textAlign: "center" },
  notFoundText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
    textAlign: "center",
  },
  notFoundSub: {
    fontSize: 13,
    color: Colors.outline,
    textAlign: "center",
  },
});
