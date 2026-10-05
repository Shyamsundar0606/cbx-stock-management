import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '../types';
import { colors, Status, styles } from './ui';

type ProductCardProps = {
  product: Product;
  onPress: () => void;
};

export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.quantity} in stock, view details`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && cardStyles.pressed]}
    >
      <View style={styles.row}>
        <Text style={cardStyles.reference}>
          {product.category} · {product.reference}
        </Text>
        <Status product={product} />
      </View>
      <Text style={cardStyles.name}>{product.name}</Text>
      <View style={styles.row}>
        <Text style={styles.subtitle}>
          <Text style={cardStyles.quantity}>{product.quantity}</Text> units available
        </Text>
        <Text style={styles.subtitle}>Threshold: {product.threshold} ›</Text>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  reference: { color: colors.muted, fontSize: 12, fontWeight: '600', flex: 1 },
  name: { fontSize: 18, color: colors.ink, fontWeight: '700' },
  quantity: { fontSize: 20, fontWeight: '600', color: colors.ink },
});
