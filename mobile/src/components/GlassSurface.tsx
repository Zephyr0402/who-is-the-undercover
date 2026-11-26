import type { PropsWithChildren } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";

import { glass, gradients, radius as baseRadius } from "../theme";

type GlassVariant = "regular" | "clear";

interface GlassSurfaceProps {
  /** Corner radius of the glass shape. */
  radius?: number;
  /** iOS 26 glass style. `regular` blurs, `clear` is more transparent. */
  variant?: GlassVariant;
  /** Optional tint applied to the glass. */
  tintColor?: string;
  /** Native interactive glass — reacts to touch with a subtle morph. */
  interactive?: boolean;
  /** Blur intensity used by the non-native fallback. */
  intensity?: number;
  /** Layout styles applied to the outer surface. */
  style?: StyleProp<ViewStyle>;
  /** Padding / layout styles applied to the content wrapper. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Disable the inner sheen. */
  plain?: boolean;
}

const nativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

function Sheen({ radius }: { radius: number }) {
  return (
    <LinearGradient
      colors={gradients.glassBody}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
    />
  );
}

/**
 * A Liquid Glass surface.
 *
 * On iOS 26+ this renders Apple's native `GlassView` material, which blurs and
 * refracts whatever is behind it. Everywhere else (web, Android, older iOS) it
 * falls back to a blurred, translucent, rim-lit layer.
 */
export function GlassSurface({
  children,
  radius = baseRadius,
  variant = "regular",
  tintColor,
  interactive = false,
  intensity = 45,
  style,
  contentStyle,
  plain = false,
}: PropsWithChildren<GlassSurfaceProps>) {
  if (nativeGlass) {
    return (
      <GlassView
        glassEffectStyle={variant}
        tintColor={tintColor}
        isInteractive={interactive}
        colorScheme="light"
        style={[{ borderRadius: radius }, style]}
      >
        {!plain ? <Sheen radius={radius} /> : null}
        <View
          pointerEvents="none"
          style={[styles.border, { borderRadius: radius }]}
        />
        <View style={contentStyle}>{children}</View>
      </GlassView>
    );
  }

  return (
    <View style={[{ borderRadius: radius }, styles.clip, style]}>
      <BlurView
        tint="light"
        intensity={intensity}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, backgroundColor: tintColor ?? glass.tintSoft },
        ]}
      />
      {!plain ? <Sheen radius={radius} /> : null}
      <View
        pointerEvents="none"
        style={[styles.border, { borderRadius: radius }]}
      />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  border: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderTopColor: glass.highlight,
    borderLeftColor: glass.borderSoft,
    borderRightColor: glass.borderSoft,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
});
