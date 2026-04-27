import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hinos, type Hino } from "@/data/hinos";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { useColors } from "@/hooks/useColors";

type HinoIndex = {
  hino: Hino;
  tituloNorm: string;
  letraPlana: string;
  letraNorm: string;
};

type Resultado = {
  hino: Hino;
  trecho?: { antes: string; match: string; depois: string };
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const indice: HinoIndex[] = hinos.map((h) => {
  const letraPlana = h.letra.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  return {
    hino: h,
    tituloNorm: normalize(h.titulo),
    letraPlana,
    letraNorm: normalize(letraPlana),
  };
});

function snippet(letraPlana: string, letraNorm: string, termoNorm: string) {
  const idx = letraNorm.indexOf(termoNorm);
  if (idx === -1) return undefined;
  const radius = 28;
  const ini = Math.max(0, idx - radius);
  const fim = Math.min(letraPlana.length, idx + termoNorm.length + radius);
  return {
    antes: (ini > 0 ? "…" : "") + letraPlana.slice(ini, idx),
    match: letraPlana.slice(idx, idx + termoNorm.length),
    depois:
      letraPlana.slice(idx + termoNorm.length, fim) +
      (fim < letraPlana.length ? "…" : ""),
  };
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favoritos, isFavorito, toggleFavorito } = useFavoritos();

  const [busca, setBusca] = useState("");
  const [somenteFavoritos, setSomenteFavoritos] = useState(false);

  const lista = useMemo<Resultado[]>(() => {
    const termo = busca.trim();
    const termoNorm = normalize(termo);
    const base = somenteFavoritos
      ? indice.filter((i) => favoritos.includes(i.hino.numero))
      : indice;

    if (!termoNorm) return base.map((i) => ({ hino: i.hino }));

    const resultados: Resultado[] = [];
    for (const i of base) {
      const numeroMatch = i.hino.numero.toString().includes(termo);
      const tituloMatch = i.tituloNorm.includes(termoNorm);
      if (numeroMatch || tituloMatch) {
        resultados.push({ hino: i.hino });
        continue;
      }
      const trecho = snippet(i.letraPlana, i.letraNorm, termoNorm);
      if (trecho) {
        resultados.push({ hino: i.hino, trecho });
      }
    }
    return resultados;
  }, [busca, somenteFavoritos, favoritos]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, webTopInset) + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              {hinos.length} hinos
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Hinário
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.selectionAsync();
              }
              setSomenteFavoritos((v) => !v);
            }}
            style={({ pressed }) => [
              styles.favToggle,
              {
                backgroundColor: somenteFavoritos
                  ? colors.primary
                  : colors.secondary,
                opacity: pressed ? 0.85 : 1,
                borderRadius: colors.radius,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              somenteFavoritos ? "Mostrar todos" : "Mostrar favoritos"
            }
          >
            <Feather
              name="star"
              size={18}
              color={
                somenteFavoritos ? colors.primaryForeground : colors.foreground
              }
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: colors.secondary,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por número, título ou letra"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {busca.length > 0 && (
            <Pressable
              onPress={() => setBusca("")}
              hitSlop={8}
              accessibilityLabel="Limpar busca"
            >
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(item) => item.hino.numero.toString()}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + webBottomInset + 24,
        }}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather
              name={somenteFavoritos ? "star" : "search"}
              size={36}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {somenteFavoritos
                ? "Nenhum favorito ainda"
                : "Nenhum hino encontrado"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {somenteFavoritos
                ? "Toque na estrela em um hino para salvá-lo aqui."
                : "Tente outro número, título ou trecho da letra."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { hino, trecho } = item;
          const fav = isFavorito(hino.numero);
          return (
            <Pressable
              onPress={() => router.push(`/hino/${hino.numero}`)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.numeroPill,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: colors.radius - 4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numeroText,
                    { color: colors.secondaryForeground },
                  ]}
                >
                  {hino.numero}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowTitleLine}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.rowTitle,
                      { color: colors.foreground, flexShrink: 1 },
                    ]}
                  >
                    {hino.titulo}
                  </Text>
                  {hino.tom ? (
                    <View
                      style={[
                        styles.tomChip,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tomChipText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {hino.tom}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {trecho ? (
                  <Text
                    numberOfLines={2}
                    style={[styles.rowSub, { color: colors.mutedForeground }]}
                  >
                    {trecho.antes}
                    <Text
                      style={{
                        color: colors.accent,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      {trecho.match}
                    </Text>
                    {trecho.depois}
                  </Text>
                ) : (
                  <Text
                    numberOfLines={1}
                    style={[styles.rowSub, { color: colors.mutedForeground }]}
                  >
                    {hino.letra.replace(/\*\*/g, "").replace(/\s+/g, " ").slice(0, 60)}…
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  toggleFavorito(hino.numero);
                }}
                hitSlop={10}
                style={styles.starBtn}
                accessibilityRole="button"
                accessibilityLabel={
                  fav ? "Remover dos favoritos" : "Marcar como favorito"
                }
              >
                <Feather
                  name="star"
                  size={20}
                  color={fav ? colors.accent : colors.mutedForeground}
                  style={fav ? undefined : { opacity: 0.6 }}
                />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 34,
    letterSpacing: -0.5,
  },
  favToggle: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  numeroPill: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  numeroText: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 16,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  rowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  tomChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tomChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  starBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 18,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
