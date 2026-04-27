import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cifras } from "@/data/cifras";
import { useHinos } from "@/contexts/HinosContext";
import { useColors } from "@/hooks/useColors";
import { getHino } from "@/lib/api";
import {
  formatarSemitons,
  transporCifra,
  transporTom,
} from "@/utils/transposeCifra";

const FONT_STEPS = [12, 13, 14, 15, 16, 18, 20];

export default function CifraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const { hinos } = useHinos();
  const num = Number(numero);
  const hino = hinos.find((h) => h.numero === num);
  const [cifraOriginal, setCifraOriginal] = useState<string | null>(
    cifras[num] ?? null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(num) || num <= 0) return;

    setLoading(true);
    void getHino(num)
      .then((response) => {
        if (!active) return;
        setCifraOriginal(response.item.cifra ?? cifras[num] ?? null);
      })
      .catch(() => {
        if (!active) return;
        setCifraOriginal(cifras[num] ?? null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [num]);

  const [fontIdx, setFontIdx] = useState(2);
  const [semitons, setSemitons] = useState(0);
  const fontSize = FONT_STEPS[fontIdx] ?? 14;
  const lineHeight = fontSize * 1.5;

  const cifra = useMemo(
    () => (cifraOriginal ? transporCifra(cifraOriginal, semitons) : ""),
    [cifraOriginal, semitons],
  );
  const tomAtual = transporTom(hino?.tom ?? null, semitons);

  const stepSemitom = (delta: number) => {
    setSemitons((s) => {
      const next = Math.max(-11, Math.min(11, s + delta));
      if (next !== s && Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
      return next;
    });
  };

  const stepFont = (delta: number) => {
    setFontIdx((idx) => {
      const next = Math.max(0, Math.min(FONT_STEPS.length - 1, idx + delta));
      if (next !== idx && Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
      return next;
    });
  };

  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  if (loading) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: colors.background, paddingTop: insets.top + 24 },
        ]}
      >
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  if (!hino || !cifraOriginal) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: colors.background, paddingTop: insets.top + 24 },
        ]}
      >
        <Stack.Screen options={{ title: "Cifra" }} />
        <Feather name="file-text" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Cifra não disponível
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Ainda não cadastramos a cifra deste hino.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Cifra ${hino.numero}` }} />

      <View
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
          Hino nº {hino.numero}
        </Text>
        <Text style={[styles.titulo, { color: colors.foreground }]}>
          {hino.titulo}
        </Text>
        <View style={styles.headerMetaRow}>
          {tomAtual ? (
            <View
              style={[
                styles.tomChip,
                { borderColor: colors.border, backgroundColor: colors.card },
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
                {tomAtual}
              </Text>
              {semitons !== 0 && hino.tom ? (
                <Text
                  style={[
                    styles.tomChipOriginal,
                    { color: colors.mutedForeground },
                  ]}
                >
                  (orig. {hino.tom})
                </Text>
              ) : null}
            </View>
          ) : null}

          <View
            style={[
              styles.transpRow,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Pressable
              onPress={() => stepSemitom(-1)}
              disabled={semitons <= -11}
              hitSlop={6}
              style={({ pressed }) => [
                styles.transpBtn,
                { opacity: semitons <= -11 ? 0.35 : pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel="Diminuir um semitom"
            >
              <Feather name="minus" size={16} color={colors.foreground} />
            </Pressable>
            <Pressable
              onPress={() => setSemitons(0)}
              disabled={semitons === 0}
              style={({ pressed }) => [
                styles.transpDisplay,
                { opacity: semitons === 0 ? 1 : pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel="Voltar ao tom original"
            >
              <Text
                style={[styles.transpLabel, { color: colors.mutedForeground }]}
              >
                Transpor
              </Text>
              <Text
                style={[
                  styles.transpValue,
                  {
                    color:
                      semitons === 0 ? colors.foreground : colors.accent,
                  },
                ]}
              >
                {formatarSemitons(semitons)}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => stepSemitom(1)}
              disabled={semitons >= 11}
              hitSlop={6}
              style={({ pressed }) => [
                styles.transpBtn,
                { opacity: semitons >= 11 ? 0.35 : pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel="Aumentar um semitom"
            >
              <Feather name="plus" size={16} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: insets.bottom + webBottomInset + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            selectable
            style={[
              styles.cifra,
              { color: colors.foreground, fontSize, lineHeight },
            ]}
          >
            {cifra}
          </Text>
        </ScrollView>
      </ScrollView>

      <View
        style={[
          styles.fontBar,
          {
            bottom: insets.bottom + webBottomInset + 16,
            backgroundColor: colors.card,
            borderColor: colors.border,
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
                fontIdx === FONT_STEPS.length - 1
                  ? 0.35
                  : pressed
                    ? 0.6
                    : 1,
            },
          ]}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  titulo: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
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
  tomChipOriginal: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  transpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  transpBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  transpDisplay: {
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  transpLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  transpValue: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 14,
  },
  cifra: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    }),
  },
  empty: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 20,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  fontBar: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fontBtn: {
    width: 44,
    height: 44,
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
    fontSize: 14,
  },
});
