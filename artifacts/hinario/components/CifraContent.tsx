import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { parseCifra } from "@/utils/parseCifra";

type Props = { cifra: string; fontSize: number };

export function CifraContent({ cifra, fontSize }: Props) {
  const colors = useColors();
  const blocks = useMemo(() => parseCifra(cifra), [cifra]);
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => (
        <View
          key={index}
          style={[
            styles.block,
            {
              backgroundColor:
                block.kind === "chorus" ? colors.chorusBackground : colors.card,
              borderColor: colors.border,
              borderLeftColor:
                block.kind === "chorus" ? colors.chorusBorder : colors.border,
              borderLeftWidth: block.kind === "chorus" ? 3 : 1,
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[
              styles.label,
              {
                color:
                  block.kind === "chorus"
                    ? colors.accent
                    : colors.mutedForeground,
              },
            ]}
          >
            {block.label}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.horizontal}
          >
            <Text
              selectable
              style={{
                fontFamily: theme.fonts.mono,
                fontSize,
                lineHeight: fontSize * 1.65,
                color: colors.foreground,
              }}
            >
              {block.lines.map((line, lineIndex) => (
                <Text
                  key={lineIndex}
                  style={{
                    color:
                      line.kind === "chords"
                        ? colors.accent
                        : line.kind === "instruction"
                          ? colors.mutedForeground
                          : colors.foreground,
                    fontWeight: line.kind === "chords" ? "700" : "400",
                  }}
                >
                  {line.text}
                  {lineIndex < block.lines.length - 1 ? "\n" : ""}
                </Text>
              ))}
            </Text>
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  blocks: { gap: 16 },
  block: { padding: 16, borderWidth: 1, borderRadius: 12 },
  label: {
    fontFamily: theme.fonts.uiSemibold,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  horizontal: { paddingBottom: 8 },
});
