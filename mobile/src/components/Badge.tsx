import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type Tone = "host" | "ready" | "offline" | "votedOut" | "revealed";

const toneStyles = {
  host: { backgroundColor: colors.hostBg, color: colors.hostText },
  ready: { backgroundColor: colors.readyBg, color: colors.readyText },
  offline: { backgroundColor: "rgba(120, 120, 128, 0.14)", color: colors.muted },
  votedOut: { backgroundColor: colors.danger, color: colors.white },
  revealed: { backgroundColor: colors.accent, color: colors.white },
} as const;

export function Badge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <View
      style={[styles.badge, { backgroundColor: toneStyles[tone].backgroundColor }]}
    >
      <Text style={[styles.label, { color: toneStyles[tone].color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});
