import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { Product, StackParams, stockStatus } from "../types";
import { Button, colors, Feedback, Status, styles } from "../components/ui";
export function ProductsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<StackParams>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [alertOnly, setAlertOnly] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await api.products());
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
  const categories = [
    "Toutes",
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];
  const query = search.trim().toLocaleLowerCase("fr");
  const filtered = products.filter(
    (p) =>
      (category === "Toutes" || p.category === category) &&
      (!alertOnly || stockStatus(p) !== "normal") &&
      `${p.name} ${p.reference}`.toLocaleLowerCase("fr").includes(query),
  );
  const alerts = products.filter((p) => stockStatus(p) !== "normal").length;
  return (
    <View style={styles.page}>
      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
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
                  fontWeight: "800",
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                CBX / ENTREPÔT
              </Text>
              <Text style={styles.title}>
                Votre stock,
                <Text style={{ color: colors.primary }}> en vue.</Text>
              </Text>
              <Text style={[styles.subtitle, { marginTop: 8 }]}>
                Un inventaire clair. Des mouvements maîtrisés.
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: "#172F33", borderColor: "#172F33" },
              ]}
            >
              <View style={styles.row}>
                <View>
                  <Text style={{ color: "#ADC9C3", fontSize: 12 }}>
                    PRODUITS RÉFÉRENCÉS
                  </Text>
                  <Text
                    style={[styles.number, { color: "white", marginTop: 6 }]}
                  >
                    {products.length}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: "#ADC9C3", fontSize: 12 }}>
                    À SURVEILLER
                  </Text>
                  <Text
                    style={[styles.number, { color: "#F1C77A", marginTop: 6 }]}
                  >
                    {alerts}
                  </Text>
                </View>
              </View>
            </View>
            <Button
              title="＋ Ajouter un produit"
              onPress={() => nav.navigate("Form")}
            />
            <TextInput
              accessibilityLabel="Rechercher un nom ou une référence"
              style={styles.input}
              placeholder="Rechercher un nom ou une référence…"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {categories.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === c }}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.chip,
                    category === c && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      color: category === c ? "white" : colors.muted,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <Text style={styles.section}>
                Inventaire{" "}
                <Text style={styles.subtitle}>({filtered.length})</Text>
              </Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: alertOnly }}
                onPress={() => setAlertOnly(!alertOnly)}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {alertOnly ? "☑" : "☐"} Alertes seules
                </Text>
              </Pressable>
            </View>
            {error && <Feedback error={error} retry={load} />}
          </View>
        }
        renderItem={({ item: p }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${p.name}, ${p.quantity} en stock, ouvrir le détail`}
            onPress={() => nav.navigate("Detail", { id: p.id })}
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.row}>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {p.category.toUpperCase()} · {p.reference}
              </Text>
              <Status product={p} />
            </View>
            <Text
              style={{ fontSize: 18, color: colors.ink, fontWeight: "700" }}
            >
              {p.name}
            </Text>
            <View style={styles.row}>
              <Text style={styles.subtitle}>
                <Text
                  style={{ fontSize: 24, fontWeight: "800", color: colors.ink }}
                >
                  {p.quantity}
                </Text>{" "}
                unités disponibles
              </Text>
              <Text style={styles.subtitle}>Seuil : {p.threshold} ›</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <Feedback loading />
          ) : !error ? (
            <View style={styles.card}>
              <Text style={styles.section}>
                {products.length
                  ? "Aucun résultat"
                  : "Votre inventaire est vide"}
              </Text>
              <Text style={styles.subtitle}>
                {products.length
                  ? "Essayez une autre recherche ou catégorie."
                  : "Ajoutez votre premier produit pour commencer."}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
