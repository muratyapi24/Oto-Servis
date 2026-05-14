import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, DarkColors } from "../constants/theme";
import { useTheme } from "./theme-provider";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = isDark ? DarkColors : Colors;

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isPending = index > currentStep;

        return (
          <React.Fragment key={index}>
            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.circle,
                  isCompleted && [styles.circleCompleted, { backgroundColor: colors.secondary }],
                  isActive && [styles.circleActive, { backgroundColor: colors.primaryContainer }],
                  isPending && [styles.circlePending, { backgroundColor: colors.surfaceContainerHigh }],
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      { color: colors.outline },
                      (isCompleted || isActive) && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: colors.onSurface },
                  isActive && [styles.stepLabelActive, { color: colors.primaryContainer }],
                  isPending && [styles.stepLabelPending, { color: colors.outline }],
                ]}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: colors.surfaceContainerHigh },
                  isCompleted && [styles.connectorCompleted, { backgroundColor: colors.secondary }],
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepWrapper: {
    alignItems: "center",
    gap: 4,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  circleCompleted: {},
  circleActive: {},
  circlePending: {},
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "500",
    maxWidth: 60,
    textAlign: "center",
  },
  stepLabelActive: {
    fontWeight: "700",
  },
  stepLabelPending: {},
  connector: {
    flex: 1,
    height: 2,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  connectorCompleted: {},
});
