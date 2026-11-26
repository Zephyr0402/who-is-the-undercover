import { StyleSheet, Text, View } from "react-native";

const palette = [
  "#007aff",
  "#34c759",
  "#ff9500",
  "#af52de",
  "#ff2d55",
  "#5ac8fa",
  "#ffcc00",
  "#8e8e93",
] as const;

interface AvatarProps {
  name: string;
  index: number;
  dimmed?: boolean;
}

/** Simple system-color initial bubble used in player lists. */
export function Avatar({ name, index, dimmed = false }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const background = palette[index % palette.length] ?? palette[0];

  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: background },
        dimmed ? styles.dimmed : null,
      ]}
    >
      <Text style={styles.initial}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dimmed: {
    opacity: 0.45,
  },
  initial: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
