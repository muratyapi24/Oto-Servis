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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/GlassHeader";
import { Colors, Radius, Shadow } from "@/constants/theme";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;
const MOCK_VALID_OTP = "123456";

export default function SmsDogrulaScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone ?? "+90 5XX XXX XX XX";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleDigitChange(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    setError(null);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
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
      setError("Lütfen 6 haneli kodu girin");
      return;
    }

    setLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    if (otp === MOCK_VALID_OTP) {
      router.replace("/(musteri)/panel");
    } else {
      setError("Hatalı kod");
    }
  }

  function handleResend() {
    if (!canResend) return;
    setCountdown(RESEND_COUNTDOWN);
    setCanResend(false);
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    inputRefs.current[0]?.focus();
  }

  const hasError = !!error;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <GlassHeader title="SMS Doğrulama" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Doğrulama Kodu</Text>
            <Text style={styles.infoBody}>
              <Text style={styles.phoneHighlight}>{phone}</Text>
              {" "}numarasına gönderilen 6 haneli kodu girin.
            </Text>
          </View>

          {/* OTP inputs */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[
                  styles.otpInput,
                  hasError && styles.otpInputError,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="numeric"
                maxLength={1}
                secureTextEntry={false}
                textAlign="center"
                selectTextOnFocus
                autoFocus={i === 0}
              />
            ))}
          </View>

          {/* Error message */}
          {hasError && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.verifyText}>Doğrula</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResend}
                activeOpacity={0.7}
              >
                <Text style={styles.resendActiveText}>Yeniden Gönder</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendCountdown}>
                Yeniden gönder{" "}
                <Text style={styles.resendCountdownNum}>{countdown}s</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
    gap: 24,
  },

  infoSection: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  infoBody: {
    fontSize: 14,
    color: Colors.outline,
    textAlign: "center",
    lineHeight: 20,
  },
  phoneHighlight: {
    fontWeight: "700",
    color: Colors.onSurface,
  },

  otpRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.onSurface,
    ...Shadow.navy,
  },
  otpInputFilled: {
    borderColor: Colors.primaryContainer,
  },
  otpInputError: {
    borderColor: Colors.error,
  },

  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: "600",
    marginTop: -8,
  },

  verifyBtn: {
    width: "100%",
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  resendRow: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  resendBtn: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  resendActiveText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  resendCountdown: {
    fontSize: 14,
    color: Colors.outline,
  },
  resendCountdownNum: {
    fontWeight: "700",
    color: Colors.onSurface,
  },
});
