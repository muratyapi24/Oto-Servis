import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

interface MechanicAvatarProps {
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: number;
}

export function MechanicAvatar({
  avatarUrl,
  firstName,
  lastName,
  size = 40,
}: MechanicAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const borderRadius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.initialsContainer,
        { width: size, height: size, borderRadius, backgroundColor: Colors.primaryContainer },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },
  initialsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
  },
});
