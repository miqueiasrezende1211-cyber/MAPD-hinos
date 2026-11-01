import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { CifraContent } from "@/components/CifraContent";
import { theme } from "@/constants/theme";
import { useHinos } from "@/contexts/HinosContext";
import { useCifra } from "@/hooks/useCifra";
import { useColors } from "@/hooks/useColors";
import { useReadingPreference } from "@/hooks/useReadingPreference";
import {
  formatarSemitons,
  transporCifra,
  transporTom,
} from "@/utils/transposeCifra";

const FONT_STEPS = [12, 13, 14, 15, 16, 18, 20] as const;

export default function CifraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const num = Number(numero);
  const validNumber = Number.isInteger(num) && num > 0;
  const { hinos } = useHinos();
  const hino = useMemo(
    () => hinos.find((item) => item.numero === num),
    [hinos, num],
  );
  const { cifra: original, loading, refreshing, error, retry } = useCifra(num);
  const { fontIdx, fontSize, stepFont } = useReadingPreference(
    "cifra",
    FONT_STEPS,
    2,
  );
  // A new route always starts in its original key, including its first render.
  const [transpose, setTranspose] = useState({ numero: num, value: 0 });
  const semitons = transpose.numero === num ? transpose.value : 0;
  const cifra = useMemo(
    () => (original ? transporCifra(original, semitons) : ""),
    [original, semitons],
  );
  const tomAtual = transporTom(hino?.tom, semitons);

  const stepSemitom = (delta: number) => {
    setTranspose({
      numero: num,
      value: Math.max(-11, Math.min(11, semitons + delta)),
    });
    if (Platform.OS !== "web") void Haptics.selectionAsync();
  };

  const buttonStyle = ({ pressed }: { pressed: boolean }) => [
    styles.iconButton,
    { opacity: pressed ? 0.65 : 1 },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{ title: validNumber ? `Cifra ${num}` : "Cifra" }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              Hino nº {validNumber ? num : "—"}
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.foreground }]}
            >
              {hino?.titulo ?? "Cifra"}
            </Text>
            {cifra ? (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Os acordes destacados acompanham a letra. Deslize os trechos
                largos para os lados.
              </Text>
            ) : null}
          </View>

          {cifra ? (
            <View
              style={[
                styles.keyControls,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.keyInfo}>
                <Text
                  style={[
                    styles.controlLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Tom atual
                </Text>
                <Text style={[styles.keyValue, { color: colors.foreground }]}>
                  {tomAtual ?? "Não informado"}
                </Text>
                {semitons !== 0 && hino?.tom ? (
                  <Text
                    style={[styles.hint, { color: colors.mutedForeground }]}
                  >
                    Original: {hino.tom}
                  </Text>
                ) : null}
              </View>
              <View style={styles.transpose}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir um semitom"
                  accessibilityState={{ disabled: semitons <= -11 }}
                  disabled={semitons <= -11}
                  onPress={() => stepSemitom(-1)}
                  style={[
                    styles.iconButton,
                    { opacity: semitons <= -11 ? 0.35 : 1 },
                  ]}
                >
                  <Feather name="minus" size={20} color={colors.foreground} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Voltar ao tom original"
                  onPress={() => setTranspose({ numero: num, value: 0 })}
                  style={styles.transposeValue}
                >
                  <Text
                    style={[
                      styles.controlLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Semitons
                  </Text>
                  <Text style={[styles.value, { color: colors.accent }]}>
                    {formatarSemitons(semitons)}
                  </Text>
                  <Text style={[styles.reset, { color: colors.accent }]}>
                    Restaurar
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar um semitom"
                  accessibilityState={{ disabled: semitons >= 11 }}
                  disabled={semitons >= 11}
                  onPress={() => stepSemitom(1)}
                  style={[
                    styles.iconButton,
                    { opacity: semitons >= 11 ? 0.35 : 1 },
                  ]}
                >
                  <Feather name="plus" size={20} color={colors.foreground} />
                </Pressable>
              </View>
            </View>
          ) : null}

          {cifra && refreshing ? (
            <View style={styles.status}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Atualizando cifra…
              </Text>
            </View>
          ) : null}
          {error && cifra ? (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.notice, { backgroundColor: colors.secondary }]}
            >
              <Text
                style={[styles.hint, { color: colors.foreground, flex: 1 }]}
              >
                Exibindo a cifra salva. Não foi possível atualizar agora.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tentar atualizar a cifra"
                disabled={refreshing}
                onPress={() => void retry()}
                style={buttonStyle}
              >
                <Feather name="refresh-cw" size={20} color={colors.accent} />
              </Pressable>
            </View>
          ) : null}

          {validNumber && cifra ? (
            <CifraContent cifra={cifra} fontSize={fontSize} />
          ) : (
            <View style={styles.empty} accessibilityLiveRegion="polite">
              {validNumber && loading ? (
                <ActivityIndicator size="large" color={colors.accent} />
              ) : (
                <Feather
                  name={error ? "wifi-off" : "file-text"}
                  size={36}
                  color={colors.mutedForeground}
                />
              )}
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {!validNumber
                  ? "Hino não encontrado"
                  : loading
                    ? "Carregando cifra…"
                    : error
                      ? "Não foi possível carregar a cifra"
                      : "Cifra não disponível"}
              </Text>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                {validNumber && !loading
                  ? error
                    ? "Conecte-se à internet para abrir uma cifra que ainda não foi salva neste aparelho."
                    : "Ainda não há uma cifra cadastrada para este hino."
                  : ""}
              </Text>
              {validNumber && error ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void retry()}
                  style={[styles.retry, { backgroundColor: colors.primary }]}
                >
                  <Text
                    style={[
                      styles.retryText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Tentar novamente
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      {cifra ? (
        <View
          style={[
            styles.toolbar,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <View style={styles.fontControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Diminuir fonte da cifra"
              accessibilityState={{ disabled: fontIdx === 0 }}
              disabled={fontIdx === 0}
              onPress={() => stepFont(-1)}
              style={[styles.iconButton, { opacity: fontIdx === 0 ? 0.35 : 1 }]}
            >
              <Feather name="minus" size={20} color={colors.foreground} />
            </Pressable>
            <View style={styles.fontDisplay}>
              <Text
                style={[styles.controlLabel, { color: colors.mutedForeground }]}
              >
                Tamanho da cifra
              </Text>
              <Text style={[styles.value, { color: colors.foreground }]}>
                {fontSize}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Aumentar fonte da cifra"
              accessibilityState={{
                disabled: fontIdx === FONT_STEPS.length - 1,
              }}
              disabled={fontIdx === FONT_STEPS.length - 1}
              onPress={() => stepFont(1)}
              style={[
                styles.iconButton,
                { opacity: fontIdx === FONT_STEPS.length - 1 ? 0.35 : 1 },
              ]}
            >
              <Feather name="plus" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  content: {
    width: "100%",
    maxWidth: theme.readingWidth,
    alignSelf: "center",
    gap: 16,
  },
  header: { gap: 8 },
  eyebrow: {
    fontFamily: theme.fonts.uiSemibold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: { fontFamily: theme.fonts.heading, fontSize: 26, lineHeight: 36 },
  hint: { fontFamily: theme.fonts.ui, fontSize: 13, lineHeight: 20 },
  keyControls: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  keyInfo: { gap: 3, flexShrink: 1 },
  keyValue: { fontFamily: theme.fonts.heading, fontSize: 19, lineHeight: 28 },
  controlLabel: {
    fontFamily: theme.fonts.uiMedium,
    fontSize: 12,
    lineHeight: 18,
  },
  transpose: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    minWidth: theme.touchTarget,
    minHeight: theme.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  transposeValue: {
    minWidth: 72,
    minHeight: theme.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  value: { fontFamily: theme.fonts.uiSemibold, fontSize: 17, lineHeight: 24 },
  reset: { fontFamily: theme.fonts.uiMedium, fontSize: 11, lineHeight: 18 },
  status: { flexDirection: "row", alignItems: "center", gap: 8 },
  notice: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: theme.fonts.ui,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 400,
  },
  retry: {
    minHeight: theme.touchTarget,
    paddingHorizontal: 24,
    borderRadius: 24,
    justifyContent: "center",
    marginTop: 4,
  },
  retryText: { fontFamily: theme.fonts.uiSemibold, fontSize: 14 },
  toolbar: { borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 16 },
  fontControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fontDisplay: { minWidth: 150, alignItems: "center" },
});
