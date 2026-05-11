import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { api } from "@/lib/api";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

type Step = "form" | "otp";

export default function MusteriLoginScreen() {
  // ── Adım 1: Plaka + Telefon ────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("form");
  const [plate, setPlate] = useState("");
  const [phone, setPhone] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Adım 2: OTP ───────────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  // Geri sayım (OTP adımında)
  useEffect(() => {
    if (step !== "otp") return;
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, step]);

  // ── Adım 1: OTP Gönder ────────────────────────────────────────────────────
  async function handleSendOTP() {
    const cleanPlate = plate.replace(/\s+/g, "").toUpperCase();
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!cleanPlate || !cleanPhone) {
      setFormError("Plaka ve telefon numarası zorunludur.");
      return;
    }
    setFormError(null);
    setFormLoading(true);
    try {
      const result = await api.musteriOtpGonder(cleanPlate, cleanPhone);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setStep("otp");
      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
    } catch (err: any) {
      setFormError(err.message ?? "Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setFormLoading(false);
    }
  }

  // ── Adım 2: OTP Doğrula ───────────────────────────────────────────────────
  function handleDigitChange(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    setOtpError(null);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const updated = [...digits];
      updated[index - 1] = "";
      setDigits(updated);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setOtpError("Lütfen 6 haneli kodu girin.");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const cleanPlate = plate.replace(/\s+/g, "").toUpperCase();
      const cleanPhone = phone.replace(/\s+/g, "");
      const result = await api.musteriOtpDogrula(cleanPlate, cleanPhone, otp);
      if (result.error || !result.token) {
        setOtpError(result.error ?? "Doğrulama başarısız.");
        return;
      }
      // Token ve müşteri bilgisini kaydet
      await AsyncStorage.setItem("auth_token", result.token);
      if (result.customer) {
        await AsyncStorage.setItem("customer_info", JSON.stringify(result.customer));
      }
      router.replace("/(musteri)/panel");
    } catch (err: any) {
      setOtpError(err.message ?? "Bağlantı hatası.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setDigits(Array(OTP_LENGTH).fill(""));
    setOtpError(null);
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    try {
      await api.musteriOtpGonder(plate.replace(/\s+/g, "").toUpperCase(), phone.replace(/\s+/g, ""));
    } catch {
      Alert.alert("Hata", "OTP tekrar gönderilemedi.");
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  if (step === "form") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <GlassHeader title="Müşteri Girişi" onBack={() => router.back()} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.content}>
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Araç Plakası ile Giriş</Text>
              <Text style={styles.infoBody}>
                Plaka numaranızı ve kayıtlı telefon numaranızı girin. SMS ile doğrulama kodu gönderilecek.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Plaka</Text>
              <TextInput
                style={styles.input}
                value={plate}
                onChangeText={(v) => setPlate(v.toUpperCase())}
                placeholder="34 ABC 001"
                placeholderTextColor={Colors.outlineVariant}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon Numarası</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0532 123 45 67"
                placeholderTextColor={Colors.outlineVariant}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            {formError && <Text style={styles.errorText}>{formError}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, formLoading && styles.btnDisabled]}
              onPress={handleSendOTP}
              disabled={formLoading}
              activeOpacity={0.85}
            >
              {formLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>SMS Kodu Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // OTP adımı
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="SMS Doğrulama" onBack={() => setStep("form")} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.content}>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Doğrulama Kodu</Text>
            <Text style={styles.infoBody}>
              <Text style={styles.phoneHighlight}>{phone}</Text>{" "}numarasına gönderilen 6 haneli kodu girin.
            </Text>
          </View>

          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[styles.otpInput, !!otpError && styles.otpInputError, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
                autoFocus={i === 0}
              />
            ))}
          </View>

          {otpError && <Text style={styles.errorText}>{otpError}</Text>}

          <TouchableOpacity
            style={[styles.primaryBtn, otpLoading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={otpLoading}
            activeOpacity={0.85}
          >
            {otpLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Doğrula</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity style={styles.resendBtn} onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendActiveText}>Yeniden Gönder</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendCountdown}>
                Yeniden gönder <Text style={styles.resendCountdownNum}>{countdown}s</Text>
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  infoSection: { marginBottom: 8 },
  infoTitle: { fontSize: 22, fontWeight: "700", color: Colors.onSurface, marginBottom: 8 },
  infoBody: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20 },
  phoneHighlight: { fontWeight: "700", color: Colors.primary },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: Colors.onSurfaceVariant },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLow,
  },
  errorText: { fontSize: 13, color: Colors.error, textAlign: "center" },
  primaryBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // OTP styles
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginVertical: 8 },
  otpInput: {
    width: 46,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.sm,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLow,
  },
  otpInputError: { borderColor: Colors.error },
  otpInputFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryContainer },
  resendRow: { alignItems: "center", marginTop: 8 },
  resendBtn: { padding: 8 },
  resendActiveText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  resendCountdown: { fontSize: 13, color: Colors.onSurfaceVariant },
  resendCountdownNum: { fontWeight: "700", color: Colors.onSurface },
});
