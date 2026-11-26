import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import type { ToastState } from "../useUndercover";

export function ToastBanner({ toast }: { toast: ToastState | null }) {
  const progress = useRef(new Animated.Value(0)).current;
  const message = toast?.message;
  const kind = toast?.kind;

  useEffect(() => {
    if (!message) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [message, kind, progress]);

  if (!toast) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[styles.animated, { opacity: progress, transform: [{ translateY }] }]}
      >
        <View style={styles.toast}>
          <Text style={styles.text}>{toast.message}</Text>
        </View>
      </Animated.View>
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
  animated: {
    maxWidth: 520,
    alignItems: "center",
  },
  toast: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(28, 28, 30, 0.86)",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
