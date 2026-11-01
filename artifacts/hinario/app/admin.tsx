import Feather from "@expo/vector-icons/Feather";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useHinos } from "@/contexts/HinosContext";
import { useColors } from "@/hooks/useColors";
import {
  buildHinoIndex,
  searchHinos,
  type SearchResult,
} from "@/utils/hinoSearch";

export default function AdminManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { hinos, refreshing, error, refresh } = useHinos();
  const [query, setQuery] = useState("");
  const index = useMemo(() => buildHinoIndex(hinos), [hinos]);
  const items = useMemo(() => searchHinos(index, query), [index, query]);
  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <Pressable
        onPress={() => router.push(`/admin-editar/${item.entry.hino.numero}`)}
        accessibilityRole="button"
        accessibilityLabel={`Editar hino ${item.entry.hino.numero}, ${item.entry.hino.titulo}`}
        style={({ pressed }) => [
          styles.item,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text style={[styles.number, { color: colors.accent }]}>
          {item.entry.hino.numero}
        </Text>
        <Text style={[styles.itemTitle, { color: colors.foreground }]}>
          {item.entry.hino.titulo}
        </Text>
        <Feather name="edit-2" size={18} color={colors.accent} />
      </Pressable>
    ),
    [router, colors.border, colors.card, colors.accent, colors.foreground],
  );

  if (!isAuthenticated)
    return (
      <View style={[styles.gate, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Administração
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Faça login para gerenciar letras e cifras.
        </Text>
        <Pressable
          onPress={() => router.replace("/login")}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text
            style={[styles.buttonText, { color: colors.primaryForeground }]}
          >
            Fazer login
          </Text>
        </Pressable>
      </View>
    );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Administração",
          headerRight: () => (
            <Pressable
              onPress={() => router.replace("/")}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Abrir hinário"
            >
              <Feather name="book-open" size={22} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.entry.hino.numero)}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Gerenciar hinos
                </Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                  {user?.nome} · {user?.papel}
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  await logout();
                  router.replace("/login");
                }}
                style={[styles.logout, { borderColor: colors.border }]}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, { color: colors.foreground }]}>
                  Sair
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push("/admin-cadastro")}
              style={[styles.button, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
            >
              <Feather name="plus" size={20} color={colors.primaryForeground} />
              <Text
                style={[styles.buttonText, { color: colors.primaryForeground }]}
              >
                Cadastrar hino
              </Text>
            </Pressable>
            <TextInput
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="Buscar hinos para editar"
              placeholder="Buscar por número, título ou letra"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            />
            {error && (
              <Text
                accessibilityRole="alert"
                style={[styles.sub, { color: colors.destructive }]}
              >
                Não foi possível atualizar. Exibindo o catálogo salvo. Puxe para
                tentar novamente.
              </Text>
            )}
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {items.length} hinos
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            Nenhum hino encontrado para esta busca.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: theme.contentWidth,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  header: { gap: 16, marginBottom: 6 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  gate: { flex: 1, padding: 24, gap: 18 },
  title: { fontFamily: theme.fonts.heading, fontSize: 26, lineHeight: 36 },
  sub: { fontFamily: theme.fonts.ui, fontSize: 14, lineHeight: 22 },
  button: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 24,
    gap: 8,
  },
  buttonText: { fontFamily: theme.fonts.uiSemibold, fontSize: 14 },
  logout: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 24,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
    fontFamily: theme.fonts.ui,
    fontSize: 15,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    gap: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
  },
  number: { minWidth: 36, fontFamily: theme.fonts.uiBold, fontSize: 15 },
  itemTitle: {
    flex: 1,
    fontFamily: theme.fonts.uiMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  empty: {
    paddingVertical: 32,
    fontFamily: theme.fonts.ui,
    fontSize: 15,
    textAlign: "center",
  },
});
