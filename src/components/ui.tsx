import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Product, stockStatus } from '../types';

export const colors = {
  bg: '#F5F5F5',
  ink: '#222222',
  muted: '#666666',
  primary: '#2563EB',
  line: '#D9D9D9',
  red: '#B91C1C',
  amber: '#92400E',
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
      <Text style={[styles.buttonText, secondary && { color: colors.primary }]}>{title}</Text>
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
          props.multiline && { height: 100, textAlignVertical: 'top' },
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

export function Status({ product }: { product: Pick<Product, 'quantity' | 'threshold'> }) {
  const status = stockStatus(product);
  const appearance = {
    out: { label: 'Out of stock', color: colors.red, background: '#FCEBEC' },
    low: { label: 'Low stock', color: colors.amber, background: '#FFF4DE' },
    normal: { label: 'Normal', color: '#15803D', background: '#E8F4EE' },
  }[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: appearance.background,
        },
      ]}
    >
      <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: appearance.color }} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: appearance.color }}>
        {appearance.label}
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
    <View style={{ padding: 24, gap: 16, alignItems: 'center' }}>
      {loading && <ActivityIndicator size="large" color={colors.primary} />}
      {!!error && (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          {retry && <Button title="Try again" onPress={retry} />}
        </>
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: 16,
    gap: 16,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0,
    color: colors.ink,
  },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 22 },
  section: { fontSize: 18, fontWeight: '700', color: colors.ink },
  card: {
    padding: 14,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    minHeight: 50,
    borderRadius: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: '#E8EDF5' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: 'white',
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  error: { color: colors.red, fontSize: 14, lineHeight: 21 },
  badge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'white',
  },
  number: { fontSize: 28, fontWeight: '600', color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line },
});
