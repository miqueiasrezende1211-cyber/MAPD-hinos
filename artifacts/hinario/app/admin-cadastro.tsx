import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HinoForm, type HinoFormState } from "@/components/HinoForm";
import { useAuth } from "@/contexts/AuthContext";
import { useHinos } from "@/contexts/HinosContext";
import { createHino, getNextHinoNumber } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function AdminCadastroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { refresh } = useHinos();

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<HinoFormState>({
    numero: 0,
    titulo: "",
    tom: "",
    letra: "",
    cifra: "",
  });

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    void getNextHinoNumber(token)
      .then((res) => setForm((prev) => ({ ...prev, numero: res.numero })))
      .catch(() =>
        Alert.alert("Erro", "Não foi possível obter número automático."),
      );
  }, [isAuthenticated, token]);

  async function handleSave() {
    if (!token) return;
    if (!form.titulo.trim() || !form.letra.trim()) {
      Alert.alert("Validação", "Título e letra são obrigatórios.");
      return;
    }

    setBusy(true);
    try {
      await createHino(
        {
          titulo: form.titulo.trim(),
          tom: form.tom.trim() || null,
          letra: form.letra,
          cifra: form.cifra,
        },
        token,
      );
      await refresh();
      Alert.alert("Sucesso", "Hino cadastrado com sucesso.");
      router.replace("/admin");
    } catch (error) {
      Alert.alert("Erro", `Falha ao cadastrar hino.\n${String(error)}`);
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
        <Text style={[styles.title, { color: colors.foreground }]}>Cadastro</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Faça login para cadastrar hinos.
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
          title: "Cadastro",
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
      <Text style={[styles.title, { color: colors.foreground }]}>Novo Hino</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Número automático. Salve letra e cifra em uma única ação.
      </Text>
      <HinoForm
        value={form}
        onChange={setForm}
        onSubmit={() => void handleSave()}
        submitLabel="Cadastrar"
        busy={busy}
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
