import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radiusPill } from "../theme";
import { GlassSurface } from "./GlassSurface";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** iOS-style segmented control with a white glass thumb. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
  style,
}: SegmentedControlProps<T>) {
  return (
    <GlassSurface
      radius={radiusPill}
      intensity={35}
      tintColor="rgba(255, 255, 255, 0.38)"
      contentStyle={styles.content}
      style={style}
    >
      {options.map((option) => {
        const active = option.value === value;
        const contentStyle = [
          styles.optionContent,
          compact ? styles.compactContent : null,
        ];

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={styles.option}
          >
            <View style={[contentStyle, active ? styles.thumb : null]}>
              <Text style={[styles.label, active ? styles.labelActive : null]}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 2,
    padding: 3,
  },
  option: {
    flex: 1,
    justifyContent: "center",
  },
  optionContent: {
    minHeight: 38,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radiusPill,
    alignItems: "center",
    justifyContent: "center",
  },
  compactContent: {
    minHeight: 30,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  thumb: {
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
  },
  labelActive: {
    color: colors.text,
    fontWeight: "600",
  },
});
