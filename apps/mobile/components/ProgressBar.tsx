import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

interface ProgressBarProps {
  value: number;   // 0-100
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({
  value,
  color = Colors.secondary,
  height = 6,
  animated = true,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clampedValue = Math.min(100, Math.max(0, value));
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedValue,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedValue);
    }
  }, [value, animated]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolated,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: "hidden",
    width: "100%",
  },
  fill: {},
});
