import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, DarkColors, Radius } from "../constants/theme";
import { useTheme } from "./theme-provider";

interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selected: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, selected, onChange }: SegmentedControlProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? DarkColors : Colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceContainer }]}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.option,
              isSelected && [styles.optionSelected, { backgroundColor: colors.primaryContainer }],
            ]}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.label,
              { color: colors.onSurface },
              isSelected && styles.labelSelected,
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: Radius.md,
    padding: 3,
    minHeight: 48,
  },
  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  optionSelected: {},
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelSelected: {
    color: "#fff",
  },
});
