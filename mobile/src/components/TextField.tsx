import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors, radius } from "../theme";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
}

export function TextField({ label, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.muted}
        style={[styles.input, focused && styles.inputFocused]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: radius,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
});
