import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors } from "../theme";
import { GlassSurface } from "./GlassSurface";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
}

export function TextField({ label, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <GlassSurface
        radius={14}
        intensity={35}
        tintColor="rgba(255, 255, 255, 0.55)"
        style={focused ? styles.focused : undefined}
        contentStyle={styles.inputWrap}
      >
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.faint}
          style={styles.input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 7,
    marginLeft: 4,
  },
  inputWrap: {
    minHeight: 50,
    justifyContent: "center",
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: "500",
    color: colors.text,
  },
  focused: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
});
