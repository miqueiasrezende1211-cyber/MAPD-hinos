import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HinoRow } from "@/components/HinoRow";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { useHinos } from "@/contexts/HinosContext";
import { useColors } from "@/hooks/useColors";
import {
  buildHinoIndex,
  searchHinos,
  type SearchResult,
} from "@/utils/hinoSearch";

const keyExtractor = (item: SearchResult) => String(item.entry.hino.numero);
const Separator = () => <View style={{ height: 10 }} />;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favoritos, toggleFavorito } = useFavoritos();
  const { isAuthenticated } = useAuth();
  const { hinos, refreshing, error, refresh } = useHinos();
  const [busca, setBusca] = useState("");
  const [somenteFavoritos, setSomenteFavoritos] = useState(false);
  const deferredSearch = useDeferredValue(busca);
  const indice = useMemo(() => buildHinoIndex(hinos), [hinos]);
  const favoriteSet = useMemo(() => new Set(favoritos), [favoritos]);
  const lista = useMemo(
    () =>
      searchHinos(
        indice,
        deferredSearch,
        somenteFavoritos ? favoriteSet : undefined,
      ),
    [indice, deferredSearch, somenteFavoritos, favoriteSet],
  );
  const openHino = useCallback(
    (numero: number) => router.push(`/hino/${numero}`),
    [router],
  );
  const favoriteHino = useCallback(
    (numero: number) => {
      if (Platform.OS !== "web") void Haptics.selectionAsync();
      toggleFavorito(numero);
    },
    [toggleFavorito],
  );
  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <HinoRow
        {...item}
        favorite={favoriteSet.has(item.entry.hino.numero)}
        onOpen={openHino}
        onFavorite={favoriteHino}
      />
    ),
    [favoriteSet, openHino, favoriteHino],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.width}>
          <View style={styles.brandRow}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              accessibilityLabel="Ministério A Palavra de Deus"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>
                A Palavra de Deus
              </Text>
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: colors.foreground }]}
              >
                Hinário
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(isAuthenticated ? "/admin" : "/login")}
              accessibilityRole="button"
              accessibilityLabel={
                isAuthenticated
                  ? "Abrir administração"
                  : "Acesso administrativo"
              }
              style={[styles.iconButton, { backgroundColor: colors.secondary }]}
            >
              <Feather
                name={isAuthenticated ? "settings" : "user"}
                size={20}
                color={colors.foreground}
              />
            </Pressable>
          </View>
          <View
            style={[
              styles.search,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Número, título ou trecho da letra"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              accessibilityLabel="Buscar hinos por número, título ou letra"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {busca.length > 0 && (
              <Pressable
                onPress={() => setBusca("")}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                style={styles.iconButton}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <View style={styles.filters}>
            {([false, true] as const).map((favorites) => (
              <Pressable
                key={String(favorites)}
                onPress={() => setSomenteFavoritos(favorites)}
                accessibilityRole="button"
                accessibilityState={{
                  selected: somenteFavoritos === favorites,
                }}
                style={[
                  styles.filter,
                  {
                    backgroundColor:
                      somenteFavoritos === favorites
                        ? colors.primary
                        : colors.secondary,
                  },
                ]}
              >
                <Feather
                  name={favorites ? "star" : "book-open"}
                  size={16}
                  color={
                    somenteFavoritos === favorites
                      ? colors.primaryForeground
                      : colors.foreground
                  }
                />
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        somenteFavoritos === favorites
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {favorites
                    ? `Favoritos (${favoritos.length})`
                    : "Todos os hinos"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      <FlatList
        data={lista}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={favoriteSet}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.resultHeader}>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.resultCount, { color: colors.mutedForeground }]}
            >
              {lista.length} {lista.length === 1 ? "hino" : "hinos"}
              {busca.trim() ? " encontrados" : " para cantar"}
            </Text>
            {refreshing ? (
              <ActivityIndicator
                size="small"
                color={colors.accent}
                accessibilityLabel="Atualizando catálogo"
              />
            ) : error ? (
              <Pressable
                onPress={() => void refresh()}
                accessibilityRole="button"
                accessibilityLabel="Sem conexão. Tentar atualizar catálogo"
                style={styles.retry}
              >
                <Feather
                  name="wifi-off"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.statusText, { color: colors.mutedForeground }]}
                >
                  Tentar atualizar
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather
              name={somenteFavoritos ? "star" : "search"}
              size={36}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {somenteFavoritos && !busca
                ? "Seus favoritos ficam aqui"
                : "Nenhum hino encontrado"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {somenteFavoritos && !busca
                ? "Toque na estrela ao lado de um hino para encontrá-lo rapidamente."
                : "Tente outro número, título ou trecho da letra."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  width: { width: "100%", maxWidth: theme.contentWidth, alignSelf: "center" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  logo: { width: 46, height: 46 },
  eyebrow: {
    fontFamily: theme.fonts.uiSemibold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  title: { fontFamily: theme.fonts.heading, fontSize: 30 },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingLeft: 14,
    paddingRight: 4,
    borderWidth: 1,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.fonts.ui,
    fontSize: 15,
    minHeight: 50,
    paddingVertical: 10,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterText: { fontFamily: theme.fonts.uiSemibold, fontSize: 13 },
  list: {
    flex: 1,
    width: "100%",
    maxWidth: theme.contentWidth,
    alignSelf: "center",
  },
  listContent: { paddingHorizontal: 16, paddingTop: 4, flexGrow: 1 },
  resultHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  resultCount: {
    flexShrink: 1,
    fontFamily: theme.fonts.uiMedium,
    fontSize: 12,
  },
  retry: { flexDirection: "row", gap: 6, alignItems: "center", minHeight: 48 },
  statusText: { fontFamily: theme.fonts.ui, fontSize: 12 },
  empty: {
    alignItems: "center",
    paddingVertical: 52,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: theme.fonts.ui,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 400,
  },
});
