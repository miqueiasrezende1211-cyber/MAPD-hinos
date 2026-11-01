import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { parseLetra } from "@/utils/parseLetra";

export const LetraContent = memo(function LetraContent({
  letra,
  fontSize = 20,
  selectable = true,
}: {
  letra: string;
  fontSize?: number;
  selectable?: boolean;
}) {
  const colors = useColors();
  const blocks = useMemo(() => parseLetra(letra), [letra]);
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => {
        const chorus = block.tipo === "coro";
        return (
          <View
            key={index}
            style={[
              styles.block,
              chorus && styles.chorus,
              chorus && {
                backgroundColor: colors.chorusBackground,
                borderLeftColor: colors.chorusBorder,
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[styles.label, { color: colors.accent }]}
            >
              {block.label}
            </Text>
            {block.spans.length > 0 && (
              <Text
                selectable={selectable}
                style={[
                  styles.text,
                  {
                    color: colors.foreground,
                    fontSize,
                    lineHeight: Math.round(fontSize * 1.65),
                  },
                ]}
              >
                {block.spans.map((span, spanIndex) => (
                  <Text
                    key={spanIndex}
                    style={span.emphasis ? styles.emphasis : undefined}
                  >
                    {span.text}
                  </Text>
                ))}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  blocks: { gap: theme.spacing.xl },
  block: { gap: theme.spacing.sm },
  chorus: {
    padding: theme.spacing.lg,
    borderLeftWidth: 3,
    borderRadius: theme.radius.md,
  },
  label: {
    fontFamily: theme.fonts.uiSemibold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  text: { fontFamily: theme.fonts.reading },
  emphasis: { fontFamily: theme.fonts.heading },
});
