import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api';
import { Movement, Product, StackParams } from '../types';
import { Button, colors, Feedback, Field, Status, styles } from '../components/ui';

export function DetailScreen({ route, navigation }: NativeStackScreenProps<StackParams, 'Detail'>) {
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'in' | 'out' | null>(null);
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [movementError, setMovementError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedProduct, movementHistory] = await Promise.all([
        api.getProduct(route.params.id),
        api.getMovements(route.params.id),
      ]);
      setProduct(loadedProduct);
      setMovements(movementHistory);
      setError(null);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  useFocusEffect(
    useCallback(() => {
      void loadProduct();
    }, [loadProduct]),
  );

  const saveMovement = async () => {
    if (!direction || saving) {
      return;
    }
    if (!/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 1000000) {
      setMovementError('Enter a whole number from 1 to 1,000,000.');
      return;
    }
    setSaving(true);
    setMovementError('');
    setSuccess('');
    try {
      const updatedProduct = await api.recordMovement(route.params.id, direction, Number(quantity));
      setProduct(updatedProduct);
      setDirection(null);
      setQuantity('');
      setSuccess('Stock updated.');
      try {
        setMovements(await api.getMovements(route.params.id));
      } catch {
        setSuccess('Stock updated. Refresh the page to reload the history.');
      }
    } catch (error) {
      setMovementError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {error ? (
          <Feedback error={error} retry={loadProduct} />
        ) : loading || !product ? (
          <Feedback loading />
        ) : (
          <>
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                {product.category} / {product.reference}
              </Text>
              <Text style={styles.title}>{product.name}</Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Status product={product} />
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.subtitle}>AVAILABLE STOCK</Text>
              <Text style={[styles.number, { fontSize: 56 }]}>
                {product.quantity}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: colors.muted,
                  }}
                >
                  {' '}
                  units
                </Text>
              </Text>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.subtitle}>Alert threshold</Text>
                <Text style={styles.label}>{product.threshold} units</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="＋ Add stock"
                  disabled={saving}
                  onPress={() => {
                    setDirection('in');
                    setMovementError('');
                    setSuccess('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="− Remove stock"
                  secondary
                  disabled={saving || product.quantity === 0}
                  onPress={() => {
                    setDirection('out');
                    setMovementError('');
                    setSuccess('');
                  }}
                />
              </View>
            </View>
            {!!success && (
              <Text accessibilityRole="alert" style={{ color: colors.primary }}>
                {success}
              </Text>
            )}
            {direction && (
              <View style={styles.card}>
                <Text style={styles.section}>
                  {direction === 'in' ? 'Add stock' : 'Remove stock'}
                </Text>
                <Field
                  label="Quantity"
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                  error={movementError}
                  editable={!saving}
                />
                <Button
                  title={saving ? 'Saving…' : 'Confirm movement'}
                  disabled={saving}
                  onPress={saveMovement}
                />
                <Button
                  title="Cancel"
                  secondary
                  disabled={saving}
                  onPress={() => setDirection(null)}
                />
              </View>
            )}
            <View style={styles.card}>
              <Text style={styles.section}>About this product</Text>
              <Text style={styles.subtitle}>
                {product.description || 'No description added yet.'}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.subtitle}>Last updated</Text>
              <Text style={styles.label}>
                {new Date(product.updatedAt).toLocaleString('en-GB')}
              </Text>
              <Button
                title="Edit product"
                secondary
                onPress={() => navigation.navigate('Form', { id: product.id })}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.section}>Recent movements</Text>
              {movements.length === 0 ? (
                <Text style={styles.subtitle}>No movements recorded yet.</Text>
              ) : (
                movements.map((movement) => (
                  <View key={movement.id} style={[styles.row, { paddingVertical: 8 }]}>
                    <View>
                      <Text style={styles.label}>
                        {movement.direction === 'in' ? 'Stock added' : 'Stock removed'}
                      </Text>
                      <Text style={styles.subtitle}>
                        {new Date(movement.createdAt).toLocaleString('en-GB')}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: movement.direction === 'in' ? colors.primary : colors.red,
                      }}
                    >
                      {movement.direction === 'in' ? '+' : '−'}
                      {movement.quantity}
                    </Text>
                  </View>
                ))
              )}
              <Text style={styles.subtitle}>Showing the 50 most recent movements.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
