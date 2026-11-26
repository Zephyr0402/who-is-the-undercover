import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radiusPill } from "../theme";
import { GlassSurface } from "./GlassSurface";

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
  const text = loading ? "…" : label;
  const buttonRadius = small ? radiusPill : 14;

  const pressableStyle = ({ pressed }: { pressed: boolean }) => [
    small ? styles.smallWrap : styles.fullWrap,
    pressed && !inactive ? styles.pressed : null,
    inactive ? styles.inactive : null,
    style,
  ];

  if (variant === "primary") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={onPress}
        style={pressableStyle}
      >
        <View
          style={[
            styles.solid,
            { borderRadius: buttonRadius },
            small ? styles.smallContent : styles.content,
          ]}
        >
          <Text
            style={[
              styles.label,
              small ? styles.smallLabel : null,
              styles.primaryLabel,
            ]}
          >
            {text}
          </Text>
        </View>
      </Pressable>
    );
  }

  const isDanger = variant === "danger";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={pressableStyle}
    >
      <GlassSurface
        radius={buttonRadius}
        tintColor={
          isDanger ? "rgba(255, 59, 48, 0.12)" : "rgba(255, 255, 255, 0.62)"
        }
        interactive={!inactive}
        intensity={40}
        style={styles.fill}
        contentStyle={small ? styles.smallContent : styles.content}
      >
        <Text
          style={[
            styles.label,
            small ? styles.smallLabel : null,
            { color: isDanger ? colors.danger : colors.secondaryText },
          ]}
        >
          {text}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWrap: {
    width: "100%",
  },
  smallWrap: {
    alignSelf: "flex-start",
  },
  fill: {
    alignSelf: "stretch",
  },
  solid: {
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  content: {
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  smallContent: {
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.82,
  },
  inactive: {
    opacity: 0.4,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  smallLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryLabel: {
    color: colors.white,
  },
});
