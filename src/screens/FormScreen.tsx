import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api';
import { StackParams } from '../types';
import { Button, Feedback, Field, styles } from '../components/ui';
type Values = {
  name: string;
  reference: string;
  category: string;
  description: string;
  quantity: string;
  threshold: string;
};

const textFields = [
  { key: 'name', label: 'Name *', placeholder: 'e.g. Safety helmet' },
  { key: 'reference', label: 'Unique reference *', placeholder: 'e.g. SEC-003' },
  { key: 'category', label: 'Category *', placeholder: 'e.g. Safety' },
  { key: 'description', label: 'Description', placeholder: 'Add a few details about this product' },
] as const;

function validateForm(values: Values): Partial<Values> {
  const errors: Partial<Values> = {};

  for (const field of ['name', 'reference', 'category'] as const) {
    if (!values[field].trim() || values[field].trim().length > 100) {
      errors[field] = 'Required. Please use 100 characters or fewer.';
    }
  }
  for (const field of ['quantity', 'threshold'] as const) {
    if (!/^\d+$/.test(values[field]) || Number(values[field]) > 1_000_000) {
      errors[field] = 'Enter a whole number from 0 to 1,000,000.';
    }
  }
  if (values.description.length > 2_000) {
    errors.description = 'Please use 2,000 characters or fewer.';
  }
  return errors;
}

export function FormScreen({ route, navigation }: NativeStackScreenProps<StackParams, 'Form'>) {
  const id = route.params?.id;
  const [values, setValues] = useState<Values>({
    name: '',
    reference: '',
    category: '',
    description: '',
    quantity: '0',
    threshold: '5',
  });
  const [errors, setErrors] = useState<Partial<Values>>({});
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const product = await api.getProduct(id);
      setValues({
        name: product.name,
        reference: product.reference,
        category: product.category,
        description: product.description,
        quantity: String(product.quantity),
        threshold: String(product.threshold),
      });
      setLoadError(null);
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadProduct();
    }, [loadProduct]),
  );

  usePreventRemove(saving, () => {});

  useEffect(() => {
    if (!saving && savedId !== null) {
      if (id) {
        navigation.popTo('Detail', { id: savedId });
      } else {
        navigation.replace('Detail', { id: savedId });
      }
    }
  }, [saving, savedId, navigation, id]);

  const updateField = (key: keyof Values, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
  };

  const saveProduct = async () => {
    if (saving) {
      return;
    }
    const issues = validateForm(values);
    setErrors(issues);
    if (Object.keys(issues).length) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const product = await api.saveProduct(
        {
          ...values,
          name: values.name.trim(),
          reference: values.reference.trim(),
          category: values.category.trim(),
          quantity: Number(values.quantity),
          threshold: Number(values.threshold),
        },
        id,
      );
      setSavedId(product.id);
      setSaving(false);
    } catch (error) {
      setError((error as Error).message);
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>{id ? 'Edit product' : 'New product'}</Text>
          <Text style={[styles.subtitle, { marginTop: 8 }]}>Fields marked * are required.</Text>
        </View>
        {loading ? (
          <Feedback loading />
        ) : loadError ? (
          <Feedback error={loadError} retry={loadProduct} />
        ) : (
          <>
            <View style={styles.card}>
              {textFields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={values[field.key]}
                  placeholder={field.placeholder}
                  onChangeText={(value) => updateField(field.key, value)}
                  error={errors[field.key]}
                  editable={!saving}
                  multiline={field.key === 'description'}
                  autoCapitalize={field.key === 'reference' ? 'characters' : 'sentences'}
                />
              ))}
              <Field
                label={id ? 'Stock quantity *' : 'Initial quantity *'}
                keyboardType="number-pad"
                value={values.quantity}
                onChangeText={(value) => updateField('quantity', value)}
                error={errors.quantity}
                editable={!saving}
              />
              <Field
                label="Alert threshold *"
                keyboardType="number-pad"
                value={values.threshold}
                onChangeText={(value) => updateField('threshold', value)}
                error={errors.threshold}
                editable={!saving}
              />
              {id && (
                <Text style={styles.subtitle}>
                  Changing the quantity here corrects the inventory. Use Add stock or Remove stock
                  on the product page to record a movement.
                </Text>
              )}
            </View>
            {error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}
            <Button
              title={saving ? 'Saving…' : id ? 'Save changes' : 'Create product'}
              disabled={saving}
              onPress={saveProduct}
            />
            <Button
              title="Cancel"
              secondary
              disabled={saving}
              onPress={() => navigation.goBack()}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
