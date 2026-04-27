import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useHinos } from "@/contexts/HinosContext";
import {
  deleteCifra,
  deleteHino,
  listHinos,
  upsertCifra,
  upsertHino,
} from "@/lib/api";

type EditableHino = {
  numero: string;
  titulo: string;
  letra: string;
  tom: string;
  tipo: string;
  possuiCifra: boolean;
  cifra: string;
};

const emptyForm: EditableHino = {
  numero: "",
  titulo: "",
  letra: "",
  tom: "",
  tipo: "",
  possuiCifra: false,
  cifra: "",
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, token, user, logout } = useAuth();
  const { refresh: refreshPublicHinos } = useHinos();

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<
    Array<{ numero: number; titulo: string; tipo: string | null; tom: string | null }>
  >([]);
  const [form, setForm] = useState<EditableHino>(emptyForm);

  const selectedNumero = useMemo(() => Number(form.numero), [form.numero]);

  async function refreshList(search = query) {
    setLoading(true);
    try {
      const response = await listHinos(search);
      setItems(
        response.items.map((item) => ({
          numero: item.numero,
          titulo: item.titulo,
          tipo: item.tipo,
          tom: item.tom,
        })),
      );
    } catch (error) {
      Alert.alert("Erro", `Falha ao carregar hinos.\n${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void refreshList();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !token) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, paddingTop: insets.top + 24 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Administração</Text>
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          Você precisa estar logado para gerenciar letras e cifras.
        </Text>
        <Pressable
          onPress={() => router.replace("/login")}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            Ir para Login
          </Text>
        </Pressable>
      </View>
    );
  }

  async function saveHino() {
    const numero = Number(form.numero);
    if (!Number.isInteger(numero) || numero <= 0) {
      Alert.alert("Validação", "Informe um número de hino válido.");
      return;
    }
    if (!form.titulo.trim() || !form.letra.trim()) {
      Alert.alert("Validação", "Título e letra são obrigatórios.");
      return;
    }

    setBusy(true);
    try {
      await upsertHino(
        numero,
        {
          titulo: form.titulo.trim(),
          letra: form.letra,
          tom: form.tom.trim() || null,
          tipo: form.tipo.trim() || null,
          possuiCifra: Boolean(form.cifra.trim()) || form.possuiCifra,
        },
        token,
      );

      if (form.cifra.trim()) {
        await upsertCifra(numero, form.cifra, token);
      }

      Alert.alert("Sucesso", "Hino salvo com sucesso.");
      await refreshList();
      await refreshPublicHinos();
    } catch (error) {
      Alert.alert("Erro", `Falha ao salvar hino.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeHino() {
    if (!Number.isInteger(selectedNumero) || selectedNumero <= 0) {
      Alert.alert("Validação", "Informe um número de hino válido.");
      return;
    }
    setBusy(true);
    try {
      await deleteHino(selectedNumero, token);
      Alert.alert("Sucesso", "Hino removido.");
      setForm(emptyForm);
      await refreshList();
      await refreshPublicHinos();
    } catch (error) {
      Alert.alert("Erro", `Falha ao remover hino.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveOnlyCifra() {
    if (!Number.isInteger(selectedNumero) || selectedNumero <= 0) {
      Alert.alert("Validação", "Informe um número de hino válido.");
      return;
    }
    if (!form.cifra.trim()) {
      Alert.alert("Validação", "Informe o conteúdo da cifra.");
      return;
    }

    setBusy(true);
    try {
      await upsertCifra(selectedNumero, form.cifra, token);
      Alert.alert("Sucesso", "Cifra salva com sucesso.");
      await refreshList();
      await refreshPublicHinos();
    } catch (error) {
      Alert.alert("Erro", `Falha ao salvar cifra.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeOnlyCifra() {
    if (!Number.isInteger(selectedNumero) || selectedNumero <= 0) {
      Alert.alert("Validação", "Informe um número de hino válido.");
      return;
    }

    setBusy(true);
    try {
      await deleteCifra(selectedNumero, token);
      Alert.alert("Sucesso", "Cifra removida.");
      setForm((prev) => ({ ...prev, cifra: "", possuiCifra: false }));
      await refreshList();
      await refreshPublicHinos();
    } catch (error) {
      Alert.alert("Erro", `Falha ao remover cifra.\n${String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top + 16 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Administração</Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>
            {user?.nome} ({user?.papel})
          </Text>
        </View>
        <Pressable
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          style={[
            styles.smallButton,
            { backgroundColor: colors.secondary, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.smallButtonText, { color: colors.foreground }]}>Sair</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Busca rápida
        </Text>
        <View style={styles.row}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrar por número, título ou letra"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
                flex: 1,
              },
            ]}
          />
          <Pressable
            onPress={() => void refreshList()}
            style={[
              styles.smallButton,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>
              Buscar
            </Text>
          </Pressable>
        </View>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={{ gap: 6 }}>
            {items.slice(0, 20).map((item) => (
              <Pressable
                key={item.numero}
                onPress={() =>
                  setForm((prev) => ({
                    ...prev,
                    numero: String(item.numero),
                    titulo: item.titulo,
                    tom: item.tom ?? "",
                    tipo: item.tipo ?? "",
                  }))
                }
                style={[
                  styles.itemRow,
                  { borderColor: colors.border, borderRadius: colors.radius },
                ]}
              >
                <Text style={[styles.itemNumber, { color: colors.foreground }]}>
                  {item.numero}
                </Text>
                <Text
                  style={[styles.itemTitle, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.titulo}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Cadastro / Edição
        </Text>
        <TextInput
          value={form.numero}
          onChangeText={(v) => setForm((prev) => ({ ...prev, numero: v }))}
          placeholder="Número"
          keyboardType="numeric"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
              borderRadius: colors.radius,
            },
          ]}
        />
        <TextInput
          value={form.titulo}
          onChangeText={(v) => setForm((prev) => ({ ...prev, titulo: v }))}
          placeholder="Título"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
              borderRadius: colors.radius,
            },
          ]}
        />
        <View style={styles.row}>
          <TextInput
            value={form.tom}
            onChangeText={(v) => setForm((prev) => ({ ...prev, tom: v }))}
            placeholder="Tom"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
                flex: 1,
              },
            ]}
          />
          <TextInput
            value={form.tipo}
            onChangeText={(v) => setForm((prev) => ({ ...prev, tipo: v }))}
            placeholder="Tipo"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
                flex: 1,
              },
            ]}
          />
        </View>
        <TextInput
          value={form.letra}
          onChangeText={(v) => setForm((prev) => ({ ...prev, letra: v }))}
          placeholder="Letra"
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.textArea,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
              borderRadius: colors.radius,
            },
          ]}
        />
        <TextInput
          value={form.cifra}
          onChangeText={(v) => setForm((prev) => ({ ...prev, cifra: v }))}
          placeholder="Cifra (opcional)"
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.textArea,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.background,
              borderRadius: colors.radius,
            },
          ]}
        />

        <View style={styles.row}>
          <Pressable
            disabled={busy}
            onPress={() => void saveHino()}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: busy ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              Salvar hino
            </Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => void removeHino()}
            style={[
              styles.button,
              {
                backgroundColor: "#d7263d",
                borderRadius: colors.radius,
                opacity: busy ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>Excluir hino</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <Pressable
            disabled={busy}
            onPress={() => void saveOnlyCifra()}
            style={[
              styles.button,
              {
                backgroundColor: colors.secondary,
                borderRadius: colors.radius,
                opacity: busy ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.foreground }]}>
              Salvar cifra
            </Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => void removeOnlyCifra()}
            style={[
              styles.button,
              {
                backgroundColor: colors.secondary,
                borderRadius: colors.radius,
                opacity: busy ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.foreground }]}>
              Excluir cifra
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 28,
  },
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  input: {
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  textArea: {
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  button: {
    height: 44,
    flex: 1,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  smallButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  smallButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemNumber: {
    width: 42,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  itemTitle: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
