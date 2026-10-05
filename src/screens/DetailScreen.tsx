import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { Movement, Product, StackParams } from "../types";
import {
  Button,
  colors,
  Feedback,
  Field,
  Status,
  styles,
} from "../components/ui";
export function DetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<StackParams, "Detail">) {
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"in" | "out" | null>(null);
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [success, setSuccess] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        api.product(route.params.id),
        api.movements(route.params.id),
      ]);
      setProduct(p);
      setMovements(m);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const submit = async () => {
    if (!direction || saving) return;
    if (
      !/^\d+$/.test(quantity) ||
      Number(quantity) < 1 ||
      Number(quantity) > 1000000
    ) {
      setMoveError("Saisissez un entier entre 1 et 1 000 000.");
      return;
    }
    setSaving(true);
    setMoveError("");
    setSuccess("");
    try {
      const p = await api.move(route.params.id, direction, Number(quantity));
      setProduct(p);
      setDirection(null);
      setQuantity("");
      setSuccess("Mouvement enregistré.");
      try {
        setMovements(await api.movements(route.params.id));
      } catch {
        setSuccess(
          "Mouvement enregistré. Actualisez pour recharger l’historique.",
        );
      }
    } catch (e) {
      setMoveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {error ? (
          <Feedback error={error} retry={load} />
        ) : loading || !product ? (
          <Feedback loading />
        ) : (
          <>
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {product.category} / {product.reference}
              </Text>
              <Text style={styles.title}>{product.name}</Text>
              <View style={{ alignSelf: "flex-start" }}>
                <Status product={product} />
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.subtitle}>QUANTITÉ DISPONIBLE</Text>
              <Text style={[styles.number, { fontSize: 56 }]}>
                {product.quantity}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.muted,
                  }}
                >
                  {" "}
                  unités
                </Text>
              </Text>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.subtitle}>Seuil d’alerte</Text>
                <Text style={styles.label}>{product.threshold} unités</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="＋ Entrée"
                  disabled={saving}
                  onPress={() => {
                    setDirection("in");
                    setMoveError("");
                    setSuccess("");
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="− Sortie"
                  secondary
                  disabled={saving || product.quantity === 0}
                  onPress={() => {
                    setDirection("out");
                    setMoveError("");
                    setSuccess("");
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
                  {direction === "in" ? "Entrée de stock" : "Sortie de stock"}
                </Text>
                <Field
                  label="Quantité du mouvement"
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                  error={moveError}
                  editable={!saving}
                />
                <Button
                  title={saving ? "Enregistrement…" : "Confirmer le mouvement"}
                  disabled={saving}
                  onPress={submit}
                />
                <Button
                  title="Annuler"
                  secondary
                  disabled={saving}
                  onPress={() => setDirection(null)}
                />
              </View>
            )}
            <View style={styles.card}>
              <Text style={styles.section}>Informations</Text>
              <Text style={styles.subtitle}>
                {product.description || "Aucune description renseignée."}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.subtitle}>Dernière mise à jour</Text>
              <Text style={styles.label}>
                {new Date(product.updatedAt).toLocaleString("fr-FR")}
              </Text>
              <Button
                title="Modifier le produit"
                secondary
                onPress={() => navigation.navigate("Form", { id: product.id })}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.section}>Derniers mouvements</Text>
              {movements.length === 0 ? (
                <Text style={styles.subtitle}>Aucun mouvement enregistré.</Text>
              ) : (
                movements.map((m) => (
                  <View key={m.id} style={[styles.row, { paddingVertical: 8 }]}>
                    <View>
                      <Text style={styles.label}>
                        {m.direction === "in"
                          ? "Entrée de stock"
                          : "Sortie de stock"}
                      </Text>
                      <Text style={styles.subtitle}>
                        {new Date(m.createdAt).toLocaleString("fr-FR")}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color:
                          m.direction === "in" ? colors.primary : colors.red,
                      }}
                    >
                      {m.direction === "in" ? "+" : "−"}
                      {m.quantity}
                    </Text>
                  </View>
                ))
              )}
              <Text style={styles.subtitle}>
                Les 50 mouvements les plus récents.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
