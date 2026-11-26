import type { PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { radius, softShadow } from "../theme";
import { GlassSurface } from "./GlassSurface";

interface CardProps {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Optional tint for highlighted cards (room code, secret word). */
  tintColor?: string;
}

export function Card({
  children,
  style,
  contentStyle,
  tintColor,
}: PropsWithChildren<CardProps>) {
  return (
    <GlassSurface
      radius={radius}
      intensity={40}
      tintColor={tintColor}
      style={[styles.card, style]}
      contentStyle={[styles.content, contentStyle]}
    >
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    ...softShadow,
  },
  content: {
    padding: 20,
  },
});
