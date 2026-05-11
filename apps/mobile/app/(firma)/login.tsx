import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { getApiBaseUrl } from "@/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBiometric() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert("Biyometrik Doğrulama", "Cihazınızda biyometrik doğrulama desteklenmiyor.");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "MS Oto Servis'e giriş yapın",
      fallbackLabel: "Şifre Kullan",
    });

    if (result.success) {
      const savedToken = await AsyncStorage.getItem("auth_token");
      const savedRole = await AsyncStorage.getItem("user_role");
      if (savedToken) {
        router.replace(savedRole === "musteri" ? "/(musteri)/panel" : "/(firma)/panel");
      } else {
        Alert.alert("Hata", "Kayıtlı oturum bulunamadı. Lütfen e-posta ile giriş yapın.");
      }
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre gereklidir.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/auth/callback/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Oturum bilgilerini çek (Cookie tabanlı auth olduğu için credential çağrısı cookie set eder)
        // Session'u çözümleyerek gerçek rolü AsyncStorage'a yazmalıyız.
        const cookieHeader = res.headers.get("set-cookie") || ""; // basitleştirilmiş cookie yakalama

        try {
          const sessionRes = await fetch(`${apiUrl}/api/auth/session`, {
            headers: cookieHeader ? { cookie: cookieHeader } : {},
          });
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData?.user?.role) {
              await AsyncStorage.setItem("user_role", sessionData.user.role);
            } else {
              await AsyncStorage.setItem("user_role", "MECHANIC"); // Fallback
            }
          }
        } catch (e) {
          await AsyncStorage.setItem("user_role", "MECHANIC");
        }

        await AsyncStorage.setItem("auth_token", "session_token");
        router.replace("/(firma)/panel");
      } else {
        Alert.alert("Giriş Başarısız", "E-posta veya şifre hatalı.");
      }
    } catch {
      Alert.alert("Bağlantı Hatası", "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>BST</Text>
          <Text style={styles.title}>Oto Servis</Text>
          <Text style={styles.subtitle}>Yönetim Platformu</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric}>
            <Text style={styles.biometricText}>🔐 Biyometrik ile Giriş</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 48, fontWeight: "900", color: "#1e40af", letterSpacing: -2 },
  title: { fontSize: 24, fontWeight: "700", color: "#1e293b", marginTop: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  form: { gap: 12 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  button: {
    backgroundColor: "#1e40af",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  biometricButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  biometricText: { color: "#1e40af", fontSize: 14, fontWeight: "600" },
});
