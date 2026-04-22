import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Colors, Shadow } from "@/constants/theme";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FirmaLayout() {
  const [role, setRole] = useState<string>("TENANT_ADMIN");

  useEffect(() => {
    AsyncStorage.getItem("user_role").then((r) => {
      if (r) setRole(r);
    });
  }, []);

  const canAccess = (tabName: string) => {
    if (role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "firma") return true;
    if (role === "MECHANIC" && ["panel", "kuyruk", "araclar", "stok"].includes(tabName)) return true;
    if (role === "RECEPTIONIST" && ["panel", "kuyruk", "araclar"].includes(tabName)) return true;
    if (role === "ACCOUNTANT" && ["panel", "finans", "stok"].includes(tabName)) return true;
    return false;
  };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.outline,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "transparent",
          paddingBottom: 8,
          height: 64,
          shadowColor: Shadow.navy.shadowColor,
          shadowOffset: Shadow.navy.shadowOffset,
          shadowOpacity: Shadow.navy.shadowOpacity,
          shadowRadius: Shadow.navy.shadowRadius,
          elevation: Shadow.navy.elevation,
        },
      }}
    >
      <Tabs.Screen
        name="panel"
        options={{
          title: "Panel",
          href: canAccess("panel") ? undefined : null,
          tabBarIcon: ({ color }) => (
             <Text style={{ fontSize: 20, color }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="kuyruk"
        options={{
          title: "Kuyruk",
          href: canAccess("kuyruk") ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔧</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="araclar"
        options={{
          title: "Araçlar",
          href: canAccess("araclar") ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🚗</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="personel"
        options={{
          title: "Personel",
          href: canAccess("personel") ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="finans"
        options={{
          title: "Finans",
          href: canAccess("finans") ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>💰</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="stok"
        options={{
          title: "Stok & Env.",
          href: canAccess("stok") ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📦</Text>
          ),
        }}
      />
    </Tabs>
  );
}
