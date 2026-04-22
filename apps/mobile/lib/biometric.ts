/**
 * Biyometrik Doğrulama Yardımcısı
 * expo-local-authentication kullanır (Face ID / Touch ID / Fingerprint)
 */

import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * Cihazın biyometrik doğrulama destekleyip desteklemediğini kontrol et
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

/**
 * Desteklenen biyometrik türleri al
 */
export async function getSupportedBiometrics(): Promise<string[]> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return types.map((t) => {
    switch (t) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return "Parmak İzi";
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return "Yüz Tanıma";
      case LocalAuthentication.AuthenticationType.IRIS:
        return "İris Tarama";
      default:
        return "Biyometrik";
    }
  });
}

/**
 * Biyometrik doğrulama yap
 */
export async function authenticateWithBiometric(
  promptMessage = "MS Oto Servis'e giriş yapın"
): Promise<BiometricResult> {
  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, error: "Biyometrik doğrulama desteklenmiyor" };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: "Şifre Kullan",
    cancelLabel: "İptal",
    disableDeviceFallback: false,
  });

  if (result.success) {
    return { success: true };
  }

  const errorMessages: Record<string, string> = {
    UserCancel: "Doğrulama iptal edildi",
    UserFallback: "Şifre ile devam edildi",
    SystemCancel: "Sistem tarafından iptal edildi",
    PasscodeNotSet: "Cihaz şifresi ayarlanmamış",
    BiometryNotAvailable: "Biyometrik doğrulama kullanılamıyor",
    BiometryNotEnrolled: "Biyometrik kayıt bulunamadı",
    BiometryLockout: "Çok fazla başarısız deneme",
  };

  return {
    success: false,
    error: errorMessages[result.error ?? ""] ?? "Doğrulama başarısız",
  };
}
