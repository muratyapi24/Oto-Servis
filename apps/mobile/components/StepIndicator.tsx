import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
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
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                  isPending && styles.circlePending,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
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
                  isActive && styles.stepLabelActive,
                  isPending && styles.stepLabelPending,
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
                  isCompleted && styles.connectorCompleted,
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
  circleCompleted: {
    backgroundColor: Colors.secondary,
  },
  circleActive: {
    backgroundColor: Colors.primaryContainer,
  },
  circlePending: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.outline,
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.onSurface,
    maxWidth: 60,
    textAlign: "center",
  },
  stepLabelActive: {
    color: Colors.primaryContainer,
    fontWeight: "700",
  },
  stepLabelPending: {
    color: Colors.outline,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  connectorCompleted: {
    backgroundColor: Colors.secondary,
  },
});
