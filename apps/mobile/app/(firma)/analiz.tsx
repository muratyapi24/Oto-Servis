import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnalizScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Analiz</Text>
        <View style={styles.placeholder}>
          <Text style={styles.icon}>📈</Text>
          <Text style={styles.text}>Firma analitik verileri burada görünecek</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faff" },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginBottom: 24 },
  placeholder: { alignItems: "center", paddingVertical: 60, gap: 12 },
  icon: { fontSize: 48 },
  text: { fontSize: 15, color: "#64748b", textAlign: "center" },
});
