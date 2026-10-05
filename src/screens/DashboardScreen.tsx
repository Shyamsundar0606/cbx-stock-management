import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Dashboard } from '../types';
import { colors, Feedback, styles } from '../components/ui';

export function DashboardScreen() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await api.getDashboard());
      setError(null);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );
  const largestCategory = Math.max(
    1,
    ...(dashboard?.categories.map((category) => category.count) || []),
  );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} />}
    >
      <View>
        <Text style={styles.title}>Overview</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          See what is available and what needs restocking.
        </Text>
      </View>
      {error ? (
        <Feedback error={error} retry={loadDashboard} />
      ) : !dashboard ? (
        <Feedback loading />
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Products', value: dashboard.total, color: colors.ink },
              {
                label: 'Units in stock',
                value: dashboard.units,
                color: colors.primary,
              },
              {
                label: 'Out of stock',
                value: dashboard.outOfStock,
                color: colors.red,
              },
              {
                label: 'Low stock',
                value: dashboard.lowStock,
                color: colors.amber,
              },
            ].map((stat) => (
              <View key={stat.label} style={[styles.card, { flexGrow: 1, flexBasis: '45%' }]}>
                <Text style={styles.subtitle}>{stat.label}</Text>
                <Text style={[styles.number, { color: stat.color }]}>{stat.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>Products by category</Text>
            <Text style={styles.subtitle}>Number of products in each category</Text>
            {dashboard.categories.length === 0 ? (
              <Text style={styles.subtitle}>Add a product to see the category breakdown.</Text>
            ) : (
              dashboard.categories.map((category, index) => (
                <View
                  key={category.category}
                  accessibilityLabel={`${category.category} : ${category.count} products`}
                  style={{ gap: 8, marginTop: 8 }}
                >
                  <View style={styles.row}>
                    <Text style={styles.label}>{category.category}</Text>
                    <Text style={styles.label}>{category.count}</Text>
                  </View>
                  <View
                    style={{
                      height: 12,
                      backgroundColor: '#EEF2F3',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: 12,
                        width: `${(category.count / largestCategory) * 100}%`,
                        borderRadius: 6,
                        backgroundColor: ['#12695C', '#59948A', '#A1BBB0', '#D4AF6D'][index % 4],
                      }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
          <View style={[styles.card, { backgroundColor: '#E8F4EE' }]}>
            <Text style={styles.section}>When does stock need attention?</Text>
            <Text style={styles.subtitle}>
              Low stock means the quantity is above zero but at or below the alert threshold.
              Out-of-stock products are counted separately.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
