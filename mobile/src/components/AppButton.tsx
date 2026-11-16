import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius } from "../theme";

type Variant = "primary" | "secondary" | "danger";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  small = false,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        small ? styles.small : styles.full,
        variantStyles[variant].container,
        pressed && !inactive && variantStyles[variant].pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      <Text style={[styles.label, variantStyles[variant].label]}>
        {loading ? "…" : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius,
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  full: {
    width: "100%",
  },
  small: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inactive: {
    opacity: 0.55,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
  },
});

const variantStyles = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryHover },
    label: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    pressed: { backgroundColor: "#d7dbe0" },
    label: { color: colors.secondaryText },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    pressed: { backgroundColor: colors.dangerHover },
    label: { color: colors.white },
  },
} as const;
