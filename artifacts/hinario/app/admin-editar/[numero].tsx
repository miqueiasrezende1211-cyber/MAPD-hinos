import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HinoForm, type HinoFormState } from "@/components/HinoForm";
import { useAuth } from "@/contexts/AuthContext";
import { useHinos } from "@/contexts/HinosContext";
import { deleteHino, getHino, updateHino } from "@/lib/api";
import { theme } from "@/constants/theme";
import { invalidateCifra } from "@/hooks/useCifra";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
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
  const { refresh, upsert, remove } = useHinos();

  const numeroInt = Number(numero);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<HinoFormState>(empty);

  useEffect(() => {
    if (!token) return;
    setForm(empty);
    setLoadError(false);
    if (!Number.isInteger(numeroInt) || numeroInt <= 0) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    void getHino(numeroInt, { signal: controller.signal })
      .then(({ item }) => {
        if (active)
          setForm({
            numero: item.numero,
            titulo: item.titulo,
            tom: item.tom ?? "",
            letra: item.letra,
            cifra: item.cifra ?? "",
          });
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [token, numeroInt, loadAttempt]);

  async function handleSave() {
    if (
      !token ||
      busy ||
      loading ||
      loadError ||
      form.numero <= 0 ||
      form.numero !== numeroInt
    )
      return;
    if (!form.titulo.trim() || !form.letra.trim()) {
      Alert.alert("Validação", "Título e letra são obrigatórios.");
      return;
    }
    setBusy(true);
    try {
      const updated = await updateHino(
        form.numero,
        {
          titulo: form.titulo.trim(),
          tom: form.tom.trim() || null,
          letra: form.letra,
          cifra: form.cifra,
        },
        token,
      );
      await upsert(updated.item);
      await invalidateCifra(form.numero, form.cifra.trim() ? form.cifra : null);
      await refresh(true);
      Alert.alert("Sucesso", "Hino atualizado.");
      router.replace("/admin");
    } catch (error) {
      Alert.alert("Erro", `Falha ao atualizar hino.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (
      !token ||
      busy ||
      loading ||
      loadError ||
      form.numero <= 0 ||
      form.numero !== numeroInt
    )
      return;
    setBusy(true);
    try {
      await deleteHino(form.numero, token);
      await remove(form.numero);
      await invalidateCifra(form.numero, null);
      await refresh(true);
      Alert.alert("Sucesso", "Hino excluído.");
      router.replace("/admin");
    } catch (error) {
      Alert.alert("Erro", `Falha ao excluir hino.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (busy || loading || loadError) return;
    if (Platform.OS === "web") {
      if (
        globalThis.confirm(
          `Excluir o hino ${form.numero}? Esta ação remove letra e cifra.`,
        )
      )
        void handleDelete();
    } else {
      Alert.alert(
        "Excluir hino?",
        `Remover o hino ${form.numero}, incluindo letra e cifra?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => void handleDelete(),
          },
        ],
      );
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
        <Text style={[styles.title, { color: colors.foreground }]}>Edição</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Faça login para editar hinos.
        </Text>
      </View>
    );
  }

  if (loading || loadError || form.numero !== numeroInt)
    return (
      <View
        style={[
          styles.root,
          { flex: 1, paddingTop: 24, backgroundColor: colors.background },
        ]}
      >
        {!loadError ? (
          <ActivityIndicator
            color={colors.accent}
            accessibilityLabel="Carregando hino para editar"
          />
        ) : (
          <>
            <Text
              accessibilityRole="alert"
              style={[styles.sub, { color: colors.destructive }]}
            >
              Não foi possível carregar o hino. Confira sua conexão e tente
              novamente.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLoadAttempt((attempt) => attempt + 1)}
              style={{ minHeight: 48, justifyContent: "center" }}
            >
              <Text
                style={{
                  color: colors.accent,
                  fontFamily: theme.fonts.uiSemibold,
                }}
              >
                Tentar novamente
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/admin")}
              style={{ minHeight: 48, justifyContent: "center" }}
            >
              <Text
                style={{
                  color: colors.accent,
                  fontFamily: theme.fonts.uiSemibold,
                }}
              >
                Voltar à administração
              </Text>
            </Pressable>
          </>
        )}
      </View>
    );

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
      <Text style={[styles.title, { color: colors.foreground }]}>
        Editar Hino
      </Text>
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
        onDelete={confirmDelete}
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
