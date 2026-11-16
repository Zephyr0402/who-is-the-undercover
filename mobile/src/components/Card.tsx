import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { cardShadow, colors, radius } from "../theme";

interface CardProps {
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: PropsWithChildren<CardProps>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 18,
    marginBottom: 14,
    ...cardShadow,
  },
});
