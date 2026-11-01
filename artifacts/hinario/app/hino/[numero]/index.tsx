import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHinos } from "@/contexts/HinosContext";
import { useFavoritos } from "@/contexts/FavoritosContext";
import { useColors } from "@/hooks/useColors";
import { useReadingPreference } from "@/hooks/useReadingPreference";
import { LetraContent } from "@/components/LetraContent";
import { theme } from "@/constants/theme";

const FONT_STEPS = [16, 18, 20, 22, 24, 26, 28];

export default function HinoDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const { isFavorito, toggleFavorito } = useFavoritos();
  const { hinos } = useHinos();

  const hino = useMemo(
    () => hinos.find((h) => h.numero.toString() === numero),
    [numero, hinos],
  );
  const cifraDisponivel = Boolean(hino?.possuiCifra);

  const {
    fontIdx,
    fontSize,
    stepFont: changeFont,
  } = useReadingPreference("letra", FONT_STEPS, 2);

  if (!hino) {
    return (
      <View
        style={[
          styles.notFound,
          { backgroundColor: colors.background, paddingTop: insets.top + 24 },
        ]}
      >
        <Feather name="book-open" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>
          Hino não encontrado
        </Text>
      </View>
    );
  }

  const fav = isFavorito(hino.numero);

  const handleFav = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleFavorito(hino.numero);
  };

  const stepFont = (delta: number) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    changeFont(delta);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `Hino ${hino.numero}`,
          headerRight: () => (
            <Pressable
              onPress={handleFav}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={
                fav ? "Remover dos favoritos" : "Marcar como favorito"
              }
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                minWidth: theme.touchTarget,
                minHeight: theme.touchTarget,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Feather
                name="star"
                size={22}
                color={fav ? colors.accent : colors.mutedForeground}
              />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          maxWidth: theme.readingWidth,
          width: "100%",
          alignSelf: "center",
          paddingTop: 8,
          paddingBottom: insets.bottom + 112,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.numeroBadge,
              {
                backgroundColor: colors.secondary,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text
              style={[
                styles.numeroBadgeText,
                { color: colors.secondaryForeground },
              ]}
            >
              Hino nº {hino.numero}
            </Text>
          </View>
          <Text style={[styles.tituloHino, { color: colors.foreground }]}>
            {hino.titulo}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.accent }]} />

          {(hino.tom || hino.possuiCifra) && (
            <View style={styles.metaRow}>
              {hino.tom ? (
                <View
                  style={[
                    styles.tomChip,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tomChipLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Tom
                  </Text>
                  <Text
                    style={[styles.tomChipValue, { color: colors.foreground }]}
                  >
                    {hino.tom}
                  </Text>
                </View>
              ) : null}

              {cifraDisponivel ? (
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync();
                    }
                    router.push(`/hino/${hino.numero}/cifra`);
                  }}
                  style={({ pressed }) => [
                    styles.cifraBtn,
                    {
                      borderColor: colors.accent,
                      backgroundColor: colors.accent,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Ver cifra do hino"
                >
                  <Feather
                    name="music"
                    size={14}
                    color={colors.accentForeground}
                  />
                  <Text
                    style={[
                      styles.cifraBtnText,
                      { color: colors.accentForeground },
                    ]}
                  >
                    Ver cifra
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        <LetraContent letra={hino.letra} fontSize={fontSize} />
      </ScrollView>

      <View
        style={[
          styles.fontBar,
          {
            bottom: insets.bottom + 16,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: 999,
          },
        ]}
      >
        <Pressable
          onPress={() => stepFont(-1)}
          disabled={fontIdx === 0}
          style={({ pressed }) => [
            styles.fontBtn,
            { opacity: fontIdx === 0 ? 0.35 : pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: fontIdx === 0 }}
          accessibilityLabel="Diminuir fonte"
        >
          <Feather name="minus" size={18} color={colors.foreground} />
        </Pressable>
        <View
          style={[styles.fontDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.fontDisplay}>
          <Text
            style={[styles.fontSizeLabel, { color: colors.mutedForeground }]}
          >
            Tamanho
          </Text>
          <Text style={[styles.fontSizeValue, { color: colors.foreground }]}>
            {fontSize}
          </Text>
        </View>
        <View
          style={[styles.fontDivider, { backgroundColor: colors.border }]}
        />
        <Pressable
          onPress={() => stepFont(1)}
          disabled={fontIdx === FONT_STEPS.length - 1}
          style={({ pressed }) => [
            styles.fontBtn,
            {
              opacity:
                fontIdx === FONT_STEPS.length - 1 ? 0.35 : pressed ? 0.6 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: fontIdx === FONT_STEPS.length - 1 }}
          accessibilityLabel="Aumentar fonte"
        >
          <Feather name="plus" size={18} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    alignItems: "flex-start",
    marginBottom: 24,
    paddingTop: 8,
  },
  numeroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  numeroBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tituloHino: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  tomChip: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tomChipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tomChipValue: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 14,
  },
  cifraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: theme.touchTarget,
    borderRadius: 999,
    borderWidth: 1,
  },
  cifraBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  fontBar: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fontBtn: {
    width: theme.touchTarget,
    height: theme.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  fontDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 6,
  },
  fontDisplay: {
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fontSizeValue: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 16,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    gap: 12,
  },
  notFoundTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 20,
  },
});
