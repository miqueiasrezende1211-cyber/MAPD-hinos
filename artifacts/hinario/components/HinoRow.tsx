import Feather from "@expo/vector-icons/Feather";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { SearchResult } from "@/utils/hinoSearch";

type Props = SearchResult & {
  favorite: boolean;
  onOpen: (numero: number) => void;
  onFavorite: (numero: number) => void;
};

export const HinoRow = memo(function HinoRow({
  entry,
  trecho,
  favorite,
  onOpen,
  onFavorite,
}: Props) {
  const colors = useColors();
  const { hino } = entry;
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Pressable
        onPress={() => onOpen(hino.numero)}
        accessibilityRole="button"
        accessibilityLabel={`Hino ${hino.numero}, ${hino.titulo}${hino.possuiCifra ? ", com cifra" : ""}`}
        style={({ pressed }) => [styles.open, { opacity: pressed ? 0.65 : 1 }]}
      >
        <View style={[styles.number, { backgroundColor: colors.secondary }]}>
          <Text
            style={[styles.numberText, { color: colors.secondaryForeground }]}
          >
            {hino.numero}
          </Text>
        </View>
        <View style={styles.copy}>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.foreground }]}
          >
            {hino.titulo}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.preview, { color: colors.mutedForeground }]}
          >
            {trecho ? (
              <>
                {trecho.antes}
                <Text
                  style={{
                    color: colors.accent,
                    fontFamily: theme.fonts.uiSemibold,
                  }}
                >
                  {trecho.match}
                </Text>
                {trecho.depois}
              </>
            ) : (
              entry.preview
            )}
          </Text>
          {(hino.tom || hino.possuiCifra) && (
            <Text style={[styles.meta, { color: colors.accent }]}>
              {[hino.tom && `Tom ${hino.tom}`, hino.possuiCifra && "Cifra"]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}
        </View>
      </Pressable>
      <Pressable
        onPress={() => onFavorite(hino.numero)}
        accessibilityRole="button"
        accessibilityState={{ selected: favorite }}
        accessibilityLabel={`${favorite ? "Remover dos" : "Adicionar aos"} favoritos: hino ${hino.numero}`}
        style={({ pressed }) => [
          styles.favorite,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Feather
          name="star"
          size={21}
          color={favorite ? colors.accent : colors.mutedForeground}
        />
        {favorite && (
          <View
            style={[styles.favoriteDot, { backgroundColor: colors.accent }]}
          />
        )}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
  },
  open: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    minHeight: 94,
  },
  number: {
    minWidth: 48,
    minHeight: 48,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  numberText: { fontFamily: theme.fonts.heading, fontSize: 16 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: theme.fonts.uiSemibold, fontSize: 16, lineHeight: 23 },
  preview: { fontFamily: theme.fonts.ui, fontSize: 13, lineHeight: 19 },
  meta: { fontFamily: theme.fonts.uiMedium, fontSize: 12, lineHeight: 18 },
  favorite: {
    width: 48,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
    gap: 4,
  },
  favoriteDot: { width: 4, height: 4, borderRadius: 2 },
});
