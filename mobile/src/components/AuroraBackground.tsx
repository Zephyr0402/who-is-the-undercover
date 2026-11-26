import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useWindowDimensions } from "react-native";

/**
 * Soft pastel wallpaper behind the glass. Kept still and low-contrast so the
 * glass surfaces stay the focus, in the spirit of the default iOS wallpaper.
 */
export function AuroraBackground() {
  const { width } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#eef3fc", "#f6f2fd", "#fff5f7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Svg
        width={width}
        height={width}
        style={[styles.blob, { top: -width * 0.55, left: -width * 0.4 }]}
      >
        <Defs>
          <RadialGradient id="bg-blue" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#5e9cff" stopOpacity={0.22} />
            <Stop offset="100%" stopColor="#5e9cff" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={width / 2} r={width / 2} fill="url(#bg-blue)" />
      </Svg>

      <Svg
        width={width}
        height={width}
        style={[styles.blob, { top: -width * 0.35, left: width * 0.45 }]}
      >
        <Defs>
          <RadialGradient id="bg-violet" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#bfa6ff" stopOpacity={0.24} />
            <Stop offset="100%" stopColor="#bfa6ff" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={width / 2} r={width / 2} fill="url(#bg-violet)" />
      </Svg>

      <Svg
        width={width}
        height={width}
        style={[styles.blob, { top: width * 0.55, left: -width * 0.5 }]}
      >
        <Defs>
          <RadialGradient id="bg-pink" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffb3c8" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#ffb3c8" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={width / 2} r={width / 2} fill="url(#bg-pink)" />
      </Svg>

      <Svg
        width={width}
        height={width}
        style={[styles.blob, { top: width * 0.9, left: width * 0.3 }]}
      >
        <Defs>
          <RadialGradient id="bg-mint" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#9be0d4" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#9be0d4" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={width / 2} r={width / 2} fill="url(#bg-mint)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
  },
});
