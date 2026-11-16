import { StyleSheet, Text, View } from "react-native";

import { cardShadow, colors, radius } from "../theme";
import type { ToastState } from "../useUndercover";

export function ToastBanner({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View
        style={[
          styles.toast,
          toast.kind === "info" ? styles.info : styles.error,
        ]}
      >
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    maxWidth: 520,
    borderRadius: radius,
    paddingHorizontal: 22,
    paddingVertical: 14,
    ...cardShadow,
  },
  error: {
    backgroundColor: colors.danger,
  },
  info: {
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
