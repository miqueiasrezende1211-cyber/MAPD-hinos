import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/useColors";

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

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <View style={styles.numberRow}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Número</Text>
        <Text style={[styles.numberValue, { color: colors.foreground }]}>{value.numero}</Text>
      </View>

      <TextInput
        value={value.titulo}
        onChangeText={(titulo) => onChange({ ...value, titulo })}
        placeholder="Título"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.background,
            borderRadius: colors.radius,
          },
        ]}
      />

      <TextInput
        value={value.tom}
        onChangeText={(tom) => onChange({ ...value, tom })}
        placeholder="Tom (opcional)"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.background,
            borderRadius: colors.radius,
          },
        ]}
      />

      <TextInput
        value={value.letra}
        onChangeText={(letra) => onChange({ ...value, letra })}
        placeholder="Letra"
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.textArea,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.background,
            borderRadius: colors.radius,
          },
        ]}
      />

      <TextInput
        value={value.cifra}
        onChangeText={(cifra) => onChange({ ...value, cifra })}
        placeholder="Cifra (opcional)"
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.textArea,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.background,
            borderRadius: colors.radius,
          },
        ]}
      />

      <View style={styles.row}>
        <Pressable
          onPress={onSubmit}
          disabled={busy}
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: busy ? 0.6 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            {submitLabel}
          </Text>
        </Pressable>
        {showDelete && onDelete ? (
          <Pressable
            onPress={onDelete}
            disabled={busy}
            style={[
              styles.button,
              {
                backgroundColor: "#d7263d",
                borderRadius: colors.radius,
                opacity: busy ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>Excluir</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  numberValue: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 18,
  },
  input: {
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  textArea: {
    minHeight: 132,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  button: {
    height: 44,
    flex: 1,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
