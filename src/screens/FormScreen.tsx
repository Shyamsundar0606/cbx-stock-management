import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, usePreventRemove } from "@react-navigation/native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api";
import { StackParams } from "../types";
import { Button, Feedback, Field, styles } from "../components/ui";
type Values = {
  name: string;
  reference: string;
  category: string;
  description: string;
  quantity: string;
  threshold: string;
};
export function FormScreen({
  route,
  navigation,
}: NativeStackScreenProps<StackParams, "Form">) {
  const id = route.params?.id;
  const [values, setValues] = useState<Values>({
    name: "",
    reference: "",
    category: "",
    description: "",
    quantity: "0",
    threshold: "5",
  });
  const [errors, setErrors] = useState<Partial<Values>>({});
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const p = await api.product(id);
      setValues({
        name: p.name,
        reference: p.reference,
        category: p.category,
        description: p.description,
        quantity: String(p.quantity),
        threshold: String(p.threshold),
      });
      setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  usePreventRemove(saving, () => {});
  useEffect(() => {
    if (!saving && savedId !== null) {
      if (id) navigation.popTo("Detail", { id: savedId });
      else navigation.replace("Detail", { id: savedId });
    }
  }, [saving, savedId, navigation, id]);
  const change = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const save = async () => {
    if (saving) return;
    const issues: Partial<Values> = {};
    for (const k of ["name", "reference", "category"] as const)
      if (!values[k].trim() || values[k].trim().length > 100)
        issues[k] = "Champ obligatoire, 100 caractères maximum.";
    for (const k of ["quantity", "threshold"] as const)
      if (!/^\d+$/.test(values[k]) || Number(values[k]) > 1000000)
        issues[k] = "Entier entre 0 et 1 000 000.";
    if (values.description.length > 2000)
      issues.description = "2000 caractères maximum.";
    setErrors(issues);
    if (Object.keys(issues).length) return;
    setSaving(true);
    setError(null);
    try {
      const p = await api.save(
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
      setSavedId(p.id);
      setSaving(false);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={styles.title}>
            {id ? "Modifier le produit" : "Nouveau produit"}
          </Text>
          <Text style={[styles.subtitle, { marginTop: 8 }]}>
            Les champs marqués * sont obligatoires.
          </Text>
        </View>
        {loading ? (
          <Feedback loading />
        ) : loadError ? (
          <Feedback error={loadError} retry={load} />
        ) : (
          <>
            <View style={styles.card}>
              {(
                [
                  {
                    key: "name",
                    label: "Nom *",
                    placeholder: "Ex. Casque de protection",
                  },
                  {
                    key: "reference",
                    label: "Référence unique *",
                    placeholder: "Ex. SEC-003",
                  },
                  {
                    key: "category",
                    label: "Catégorie *",
                    placeholder: "Ex. Sécurité",
                  },
                  {
                    key: "description",
                    label: "Description",
                    placeholder: "Informations complémentaires",
                  },
                ] as const
              ).map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChangeText={(v) => change(f.key, v)}
                  error={errors[f.key]}
                  editable={!saving}
                  multiline={f.key === "description"}
                  autoCapitalize={
                    f.key === "reference" ? "characters" : "sentences"
                  }
                />
              ))}
              <Field
                label={id ? "Quantité en stock *" : "Quantité initiale *"}
                keyboardType="number-pad"
                value={values.quantity}
                onChangeText={(v) => change("quantity", v)}
                error={errors.quantity}
                editable={!saving}
              />
              <Field
                label="Seuil d’alerte *"
                keyboardType="number-pad"
                value={values.threshold}
                onChangeText={(v) => change("threshold", v)}
                error={errors.threshold}
                editable={!saving}
              />
              {id && (
                <Text style={styles.subtitle}>
                  La modification de quantité corrige l’inventaire. Pour tracer
                  une entrée ou une sortie, utilisez les boutons du détail.
                </Text>
              )}
            </View>
            {error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}
            <Button
              title={
                saving
                  ? "Enregistrement…"
                  : id
                    ? "Enregistrer les modifications"
                    : "Créer le produit"
              }
              disabled={saving}
              onPress={save}
            />
            <Button
              title="Annuler"
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
