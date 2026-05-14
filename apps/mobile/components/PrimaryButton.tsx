import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { Colors, DarkColors, Radius } from "../constants/theme";
import { useTheme } from "./theme-provider";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? DarkColors : Colors;
  
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
          { height, borderRadius: Radius.md, backgroundColor: colors.primaryContainer },
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
          { height, borderRadius: Radius.md, borderColor: colors.primaryContainer },
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryContainer} size="small" />
        ) : (
          <Text style={[styles.outlineText, { fontSize, color: colors.primaryContainer }]}>{label}</Text>
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
        <ActivityIndicator color={colors.primaryContainer} size="small" />
      ) : (
        <Text style={[styles.ghostText, { fontSize, color: colors.primaryContainer }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradientFallback: {
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  outlineText: {
    fontWeight: "600",
  },
  ghost: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  ghostText: {
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
