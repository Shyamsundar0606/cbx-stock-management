import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Product, stockStatus } from "../types";
export const colors = {
  bg: "#F4F6F8",
  ink: "#172B36",
  muted: "#6C7C85",
  primary: "#12695C",
  line: "#E1E7EB",
  red: "#B43F45",
  amber: "#95600A",
};
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          styles.input,
          props.multiline && { height: 100, textAlignVertical: "top" },
          error && { borderColor: colors.red },
          props.style,
        ]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function Status({
  product,
}: {
  product: Pick<Product, "quantity" | "threshold">;
}) {
  const status = stockStatus(product);
  const color =
    status === "out"
      ? colors.red
      : status === "low"
        ? colors.amber
        : colors.primary;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:
            status === "out"
              ? "#FCEBEC"
              : status === "low"
                ? "#FFF4DE"
                : "#E8F4EE",
        },
      ]}
    >
      <View
        style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: color }}
      />
      <Text style={{ fontSize: 12, fontWeight: "700", color }}>
        {status === "out"
          ? "Rupture"
          : status === "low"
            ? "Stock faible"
            : "Normal"}
      </Text>
    </View>
  );
}
export function Feedback({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
}) {
  return (
    <View style={{ padding: 24, gap: 16, alignItems: "center" }}>
      {loading && <ActivityIndicator size="large" color={colors.primary} />}
      {!!error && (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          {retry && <Button title="Réessayer" onPress={retry} />}
        </>
      )}
    </View>
  );
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: 20,
    gap: 20,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    color: colors.ink,
  },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 22 },
  section: { fontSize: 18, fontWeight: "700", color: colors.ink },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  button: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: "#E8F4EE" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 15 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: "white",
  },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  error: { color: colors.red, fontSize: 14, lineHeight: 21 },
  badge: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "white",
  },
  number: { fontSize: 32, fontWeight: "800", color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line },
});
