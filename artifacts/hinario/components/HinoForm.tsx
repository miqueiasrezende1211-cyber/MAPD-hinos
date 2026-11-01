import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { LetraContent } from "@/components/LetraContent";

export type HinoFormState = {
  numero: number;
  titulo: string;
  tom: string;
  letra: string;
  cifra: string;
};

type Props = {
  value: HinoFormState;
  onChange: (next: HinoFormState) => void;
  onSubmit: () => void;
  submitLabel: string;
  busy?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
};

export function HinoForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  busy,
  showDelete,
  onDelete,
}: Props) {
  const colors = useColors();
  const [preview, setPreview] = useState(false);
  const fieldStyle = {
    color: colors.foreground,
    borderColor: colors.input,
    backgroundColor: colors.background,
  };
  const labelStyle = [styles.label, { color: colors.foreground }];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.numberRow}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
          Número do hino
        </Text>
        <Text style={[styles.numberValue, { color: colors.accent }]}>
          {value.numero}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>Título</Text>
        <TextInput
          accessibilityLabel="Título do hino"
          value={value.titulo}
          onChangeText={(titulo) => onChange({ ...value, titulo })}
          editable={!busy}
          placeholder="Digite o título"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, fieldStyle]}
        />
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>
          Tom <Text style={{ color: colors.mutedForeground }}>(opcional)</Text>
        </Text>
        <TextInput
          accessibilityLabel="Tom do hino, opcional"
          value={value.tom}
          onChangeText={(tom) => onChange({ ...value, tom })}
          editable={!busy}
          autoCorrect={false}
          placeholder="Ex.: C, G ou F#m"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, fieldStyle]}
        />
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>Letra</Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Separe as estrofes com uma linha em branco. Envolva o coro completo
          com ** ou inicie o bloco com “Coro”. Use “Ponte” e “Proclamação” em
          uma linha própria para nomear essas seções.
        </Text>
        <TextInput
          accessibilityLabel="Letra do hino"
          accessibilityHint="Separe estrofes com uma linha em branco e envolva o coro com dois asteriscos."
          value={value.letra}
          onChangeText={(letra) => onChange({ ...value, letra })}
          editable={!busy}
          placeholder="Digite ou cole a letra"
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.textArea, fieldStyle]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: preview }}
          onPress={() => setPreview((visible) => !visible)}
          style={({ pressed }) => [
            styles.previewButton,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text
            style={[styles.buttonText, { color: colors.secondaryForeground }]}
          >
            {preview ? "Ocultar prévia da letra" : "Ver prévia da letra"}
          </Text>
        </Pressable>
        {preview && (
          <View style={[styles.preview, { borderColor: colors.border }]}>
            {value.letra.trim() ? (
              <LetraContent
                letra={value.letra}
                fontSize={16}
                selectable={false}
              />
            ) : (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                A prévia aparece ao preencher a letra.
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>
          Cifra{" "}
          <Text style={{ color: colors.mutedForeground }}>(opcional)</Text>
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Mantenha os acordes acima da letra, usando espaços para alinhá-los.
          Separe as seções com uma linha em branco.
        </Text>
        <TextInput
          accessibilityLabel="Cifra do hino, opcional"
          value={value.cifra}
          onChangeText={(cifra) => onChange({ ...value, cifra })}
          editable={!busy}
          autoCorrect={false}
          autoCapitalize="none"
          placeholder="Cole a cifra com os acordes acima da letra"
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.textArea, styles.cifra, fieldStyle]}
        />
      </View>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy, busy }}
          onPress={onSubmit}
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: busy ? 0.6 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text
            style={[styles.buttonText, { color: colors.primaryForeground }]}
          >
            {busy ? "Aguarde…" : submitLabel}
          </Text>
        </Pressable>
        {showDelete && onDelete && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            onPress={onDelete}
            disabled={busy}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.destructive,
                opacity: busy ? 0.6 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                { color: colors.destructiveForeground },
              ]}
            >
              Excluir hino
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: theme.contentWidth,
    alignSelf: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  field: { gap: theme.spacing.sm },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontFamily: theme.fonts.uiSemibold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  label: { fontFamily: theme.fonts.uiSemibold, fontSize: 14, lineHeight: 22 },
  hint: { fontFamily: theme.fonts.ui, fontSize: 13, lineHeight: 21 },
  numberValue: { fontFamily: theme.fonts.heading, fontSize: 22 },
  input: {
    minHeight: theme.touchTarget,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: theme.fonts.ui,
    fontSize: 16,
  },
  textArea: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    fontFamily: theme.fonts.ui,
    fontSize: 16,
    lineHeight: 25,
  },
  cifra: { fontFamily: theme.fonts.mono, fontSize: 14, lineHeight: 23 },
  row: { flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" },
  button: {
    minHeight: theme.touchTarget,
    flex: 1,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: theme.radius.pill,
  },
  buttonText: {
    fontFamily: theme.fonts.uiSemibold,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  previewButton: {
    minHeight: theme.touchTarget,
    borderRadius: theme.radius.md,
    padding: 12,
    justifyContent: "center",
  },
  preview: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16 },
});
