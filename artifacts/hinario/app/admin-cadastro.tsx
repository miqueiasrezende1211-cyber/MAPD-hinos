import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HinoForm, type HinoFormState } from "@/components/HinoForm";
import { useAuth } from "@/contexts/AuthContext";
import { useHinos } from "@/contexts/HinosContext";
import { createHino, getNextHinoNumber } from "@/lib/api";
import { theme } from "@/constants/theme";
import { invalidateCifra } from "@/hooks/useCifra";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";

export default function AdminCadastroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { refresh, upsert } = useHinos();

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
    let active = true;
    void getNextHinoNumber(token)
      .then((res) => {
        if (active) setForm((prev) => ({ ...prev, numero: res.numero }));
      })
      .catch(() => {
        if (active)
          Alert.alert(
            "Erro",
            "Não foi possível obter número automático. O número será atribuído ao salvar.",
          );
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, token]);

  async function handleSave() {
    if (!token || busy) return;
    if (!form.titulo.trim() || !form.letra.trim()) {
      Alert.alert("Validação", "Título e letra são obrigatórios.");
      return;
    }

    setBusy(true);
    try {
      const created = await createHino(
        {
          titulo: form.titulo.trim(),
          tom: form.tom.trim() || null,
          letra: form.letra,
          cifra: form.cifra,
        },
        token,
      );
      await upsert(created.item);
      await invalidateCifra(
        created.item.numero,
        form.cifra.trim() ? form.cifra : null,
      );
      await refresh(true);
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
          { backgroundColor: colors.background, paddingTop: 20, flex: 1 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Cadastro
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Faça login para cadastrar hinos.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        },
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
      <Text style={[styles.title, { color: colors.foreground }]}>
        Novo Hino
      </Text>
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
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: theme.contentWidth,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontSize: 28,
  },
  sub: {
    fontFamily: theme.fonts.ui,
    fontSize: 13,
    marginBottom: 2,
  },
  headerIconHit: {
    width: theme.touchTarget,
    height: theme.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
