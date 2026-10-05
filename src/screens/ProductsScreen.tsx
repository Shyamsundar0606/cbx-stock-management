import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../api';
import { Product, StackParams, stockStatus } from '../types';
import { Button, colors, Feedback, styles } from '../components/ui';
import { ProductCard } from '../components/ProductCard';

export function ProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [alertOnly, setAlertOnly] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await api.getProducts());
      setError(null);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProducts();
    }, [loadProducts]),
  );

  const categories = [
    'All',
    ...Array.from(new Set(products.map((product) => product.category))).sort(),
  ];

  const query = search.trim().toLocaleLowerCase('en');

  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category;
    const matchesAlert = !alertOnly || stockStatus(product) !== 'normal';
    const searchableText = [product.name, product.reference].join(' ').toLowerCase();

    return matchesCategory && matchesAlert && searchableText.includes(query);
  });

  const alertCount = products.filter((product) => stockStatus(product) !== 'normal').length;

  return (
    <View style={styles.page}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(product) => String(product.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadProducts}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <View>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 12,
                  fontWeight: '800',
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                CBX / WAREHOUSE
              </Text>
              <Text style={styles.title}>
                Your stock,
                <Text style={{ color: colors.primary }}> at a glance.</Text>
              </Text>
              <Text style={[styles.subtitle, { marginTop: 8 }]}>
                Check quantities and keep track of stock changes.
              </Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#172F33', borderColor: '#172F33' }]}>
              <View style={styles.row}>
                <View>
                  <Text style={{ color: '#ADC9C3', fontSize: 12 }}>PRODUCTS</Text>
                  <Text style={[styles.number, { color: 'white', marginTop: 6 }]}>
                    {products.length}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: '#ADC9C3', fontSize: 12 }}>NEED ATTENTION</Text>
                  <Text style={[styles.number, { color: '#F1C77A', marginTop: 6 }]}>
                    {alertCount}
                  </Text>
                </View>
              </View>
            </View>
            <Button title="＋ Add product" onPress={() => navigation.navigate('Form')} />
            <TextInput
              accessibilityLabel="Search by name or reference"
              style={styles.input}
              placeholder="Search by name or reference…"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {categories.map((categoryName) => (
                <Pressable
                  key={categoryName}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === categoryName }}
                  onPress={() => setCategory(categoryName)}
                  style={[
                    styles.chip,
                    category === categoryName && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: '600',
                      color: category === categoryName ? 'white' : colors.muted,
                    }}
                  >
                    {categoryName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <Text style={styles.section}>
                Inventory <Text style={styles.subtitle}>({filteredProducts.length})</Text>
              </Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: alertOnly }}
                onPress={() => setAlertOnly(!alertOnly)}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {alertOnly ? '☑' : '☐'} Alerts only
                </Text>
              </Pressable>
            </View>
            {error && <Feedback error={error} retry={loadProducts} />}
          </View>
        }
        renderItem={({ item: product }) => (
          <ProductCard
            product={product}
            onPress={() => navigation.navigate('Detail', { id: product.id })}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Feedback loading />
          ) : !error ? (
            <View style={styles.card}>
              <Text style={styles.section}>
                {products.length ? 'No matching products' : 'Your inventory is empty'}
              </Text>
              <Text style={styles.subtitle}>
                {products.length
                  ? 'Try another search or category.'
                  : 'Add your first product to get started.'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
