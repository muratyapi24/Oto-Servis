import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Radius } from "../constants/theme";

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
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.option, isSelected && styles.optionSelected]}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
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
    backgroundColor: Colors.surfaceContainer,
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
  optionSelected: {
    backgroundColor: Colors.primaryContainer,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  labelSelected: {
    color: "#fff",
  },
});
