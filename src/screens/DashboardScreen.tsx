import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api";
import { Dashboard } from "../types";
import { colors, Feedback, styles } from "../components/ui";
export function DashboardScreen() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.dashboard());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View>
        <Text style={styles.title}>Vue d’ensemble</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          Les bons chiffres pour anticiper vos besoins.
        </Text>
      </View>
      {error ? (
        <Feedback error={error} retry={load} />
      ) : !data ? (
        <Feedback loading />
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {[
              { label: "Produits", value: data.total, color: colors.ink },
              {
                label: "Unités en stock",
                value: data.units,
                color: colors.primary,
              },
              {
                label: "En rupture",
                value: data.outOfStock,
                color: colors.red,
              },
              {
                label: "Stock faible",
                value: data.lowStock,
                color: colors.amber,
              },
            ].map((x) => (
              <View
                key={x.label}
                style={[styles.card, { flexGrow: 1, flexBasis: "45%" }]}
              >
                <Text style={styles.subtitle}>{x.label}</Text>
                <Text style={[styles.number, { color: x.color }]}>
                  {x.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.section}>Répartition par catégorie</Text>
            <Text style={styles.subtitle}>Nombre de produits référencés</Text>
            {data.categories.length === 0 ? (
              <Text style={styles.subtitle}>
                Ajoutez un produit pour afficher la répartition.
              </Text>
            ) : (
              data.categories.map((c, i) => (
                <View
                  key={c.category}
                  accessibilityLabel={`${c.category} : ${c.count} produits`}
                  style={{ gap: 8, marginTop: 8 }}
                >
                  <View style={styles.row}>
                    <Text style={styles.label}>{c.category}</Text>
                    <Text style={styles.label}>{c.count}</Text>
                  </View>
                  <View
                    style={{
                      height: 12,
                      backgroundColor: "#EEF2F3",
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 12,
                        width: `${(c.count / Math.max(...data.categories.map((x) => x.count))) * 100}%`,
                        borderRadius: 6,
                        backgroundColor: [
                          "#12695C",
                          "#59948A",
                          "#A1BBB0",
                          "#D4AF6D",
                        ][i % 4],
                      }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
          <View style={[styles.card, { backgroundColor: "#E8F4EE" }]}>
            <Text style={styles.section}>
              Anticiper, c’est gagner du temps.
            </Text>
            <Text style={styles.subtitle}>
              Le stock faible correspond aux produits dont la quantité est
              positive et inférieure ou égale au seuil. Les ruptures sont
              comptées séparément.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
