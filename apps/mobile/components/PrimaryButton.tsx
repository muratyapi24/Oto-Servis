import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { Colors, Radius } from "../constants/theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "gradient" | "outline" | "ghost";
}

const SIZE_HEIGHT = { sm: 40, md: 48, lg: 56 };
const SIZE_FONT = { sm: 13, md: 15, lg: 16 };

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  size = "md",
  variant = "gradient",
}: PrimaryButtonProps) {
  const height = SIZE_HEIGHT[size];
  const fontSize = SIZE_FONT[size];
  const isDisabled = disabled || loading;

  if (variant === "gradient") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          styles.gradientFallback,
          { height, borderRadius: Radius.md },
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[styles.gradientText, { fontSize }]}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === "outline") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.outline,
          { height, borderRadius: Radius.md },
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primaryContainer} size="small" />
        ) : (
          <Text style={[styles.outlineText, { fontSize }]}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[styles.ghost, { height }, isDisabled && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primaryContainer} size="small" />
      ) : (
        <Text style={[styles.ghostText, { fontSize }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientFallback: {
    backgroundColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  gradientText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  outlineText: {
    color: Colors.primaryContainer,
    fontWeight: "600",
  },
  ghost: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  ghostText: {
    color: Colors.primaryContainer,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
