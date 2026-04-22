import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Image, ActivityIndicator,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

interface ServiceCameraProps {
  serviceOrderId: string;
  onPhotoUploaded?: (url: string) => void;
  onClose?: () => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export function ServiceCamera({ serviceOrderId, onPhotoUploaded, onClose }: ServiceCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#1e40af" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Kamera erişimi gerekli</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    const result = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (result) setPhoto(result.uri);
  }

  async function uploadPhoto() {
    if (!photo) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: photo,
        type: "image/jpeg",
        name: `service-${serviceOrderId}-${Date.now()}.jpg`,
      } as any);
      formData.append("serviceOrderId", serviceOrderId);

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onPhotoUploaded?.(data.url);
        Alert.alert("Başarılı", "Fotoğraf yüklendi");
        setPhoto(null);
      } else {
        Alert.alert("Hata", "Fotoğraf yüklenemedi");
      }
    } catch {
      Alert.alert("Hata", "Bağlantı hatası");
    } finally {
      setUploading(false);
    }
  }

  if (photo) {
    return (
      <View style={styles.preview}>
        <Image source={{ uri: photo }} style={styles.previewImage} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
            <Text style={styles.retakeBtnText}>Yeniden Çek</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
            onPress={uploadPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadBtnText}>Yükle</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === "back" ? "front" : "back")}>
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  permText: { fontSize: 16, color: "#1e293b" },
  permBtn: { backgroundColor: "#1e40af", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  permBtnText: { color: "#fff", fontWeight: "600" },
  controls: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32,
  },
  flipBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  flipText: { fontSize: 20 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#fff",
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  closeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  closeText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  preview: { flex: 1 },
  previewImage: { flex: 1 },
  previewActions: {
    flexDirection: "row", gap: 12, padding: 20,
    backgroundColor: "#fff",
  },
  retakeBtn: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 14, alignItems: "center" },
  retakeBtnText: { fontWeight: "600", color: "#475569" },
  uploadBtn: { flex: 1, backgroundColor: "#1e40af", borderRadius: 12, padding: 14, alignItems: "center" },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: "#fff", fontWeight: "700" },
});
