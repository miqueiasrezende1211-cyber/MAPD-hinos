import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HinoForm, type HinoFormState } from "@/components/HinoForm";
import { useAuth } from "@/contexts/AuthContext";
import { useHinos } from "@/contexts/HinosContext";
import { deleteHino, getHino, updateHino } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const empty: HinoFormState = {
  numero: 0,
  titulo: "",
  tom: "",
  letra: "",
  cifra: "",
};

export default function AdminEditarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const { token, isAuthenticated } = useAuth();
  const { refresh } = useHinos();

  const numeroInt = Number(numero);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<HinoFormState>(empty);

  useEffect(() => {
    if (!token || !Number.isInteger(numeroInt) || numeroInt <= 0) return;
    setBusy(true);
    void getHino(numeroInt)
      .then((res) => {
        const item = res.item;
        setForm({
          numero: item.numero,
          titulo: item.titulo,
          tom: item.tom ?? "",
          letra: item.letra,
          cifra: item.cifra ?? "",
        });
      })
      .catch(() => Alert.alert("Erro", "Não foi possível carregar este hino."))
      .finally(() => setBusy(false));
  }, [token, numeroInt]);

  async function handleSave() {
    if (!token) return;
    if (!form.titulo.trim() || !form.letra.trim()) {
      Alert.alert("Validação", "Título e letra são obrigatórios.");
      return;
    }
    setBusy(true);
    try {
      await updateHino(
        form.numero,
        {
          titulo: form.titulo.trim(),
          tom: form.tom.trim() || null,
          letra: form.letra,
          cifra: form.cifra,
        },
        token,
      );
      await refresh();
      Alert.alert("Sucesso", "Hino atualizado.");
      router.replace("/admin");
    } catch (error) {
      Alert.alert("Erro", `Falha ao atualizar hino.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!token) return;
    setBusy(true);
    try {
      await deleteHino(form.numero, token);
      await refresh();
      Alert.alert("Sucesso", "Hino excluído.");
      router.replace("/admin");
    } catch (error) {
      Alert.alert("Erro", `Falha ao excluir hino.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated || !token) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, paddingTop: insets.top + 20 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Edição</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Faça login para editar hinos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top + 16 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{
          title: "Edição",
          headerRight: () => (
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityLabel="Ir para início"
              style={styles.headerIconHit}
            >
              <Feather name="home" size={20} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />
      <Text style={[styles.title, { color: colors.foreground }]}>Editar Hino</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Atualize letra e cifra no mesmo formulário.
      </Text>
      <HinoForm
        value={form}
        onChange={setForm}
        onSubmit={() => void handleSave()}
        submitLabel="Salvar alterações"
        busy={busy}
        showDelete
        onDelete={() => void handleDelete()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 28,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 2,
  },
  headerIconHit: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
});
