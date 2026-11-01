import Feather from "@expo/vector-icons/Feather";
import React, { useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, isAuthenticated, user, logout } = useAuth();
  const passwordInput = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function handleLogin() {
    if (loading || !email.trim() || !senha) return;
    setErro(null);
    setLoading(true);
    try {
      await login(email.trim(), senha);
      router.replace("/admin");
    } catch {
      setErro("Não foi possível entrar. Confira seu email, senha e conexão.");
    } finally {
      setLoading(false);
    }
  }
  const disabled = loading || !email.trim() || !senha;
  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.root,
        { paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.foreground }]}
      >
        Acesso administrativo
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Cadastre e organize as letras e cifras do ministério.
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {isAuthenticated && user ? (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Sessão ativa
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {user.nome} · {user.papel}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/admin")}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.buttonText, { color: colors.primaryForeground }]}
              >
                Abrir administração
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                await logout();
                setEmail("");
                setSenha("");
              }}
              style={[styles.button, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>
                Sair da conta
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordInput.current?.focus()}
              editable={!loading}
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <Text style={[styles.label, { color: colors.foreground }]}>
              Senha
            </Text>
            <View
              style={[
                styles.password,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <TextInput
                ref={passwordInput}
                value={senha}
                onChangeText={setSenha}
                placeholder="Sua senha"
                accessibilityLabel="Senha"
                secureTextEntry={!visible}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void handleLogin()}
                editable={!loading}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.passwordInput, { color: colors.foreground }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
                onPress={() => setVisible((v) => !v)}
                style={styles.eye}
              >
                <Feather
                  name={visible ? "eye-off" : "eye"}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
            {erro && (
              <Text
                accessibilityRole="alert"
                style={[styles.error, { color: colors.destructive }]}
              >
                {erro}
              </Text>
            )}
            <Pressable
              onPress={() => void handleLogin()}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled, busy: loading }}
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: disabled ? 0.55 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Entrar
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}
const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: 20,
    gap: 12,
  },
  title: { fontFamily: theme.fonts.heading, fontSize: 28, lineHeight: 39 },
  subtitle: { fontFamily: theme.fonts.ui, fontSize: 15, lineHeight: 24 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 20,
    marginTop: 8,
    gap: 12,
  },
  label: { fontFamily: theme.fonts.uiSemibold, fontSize: 14 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontFamily: theme.fonts.ui,
    fontSize: 16,
  },
  password: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: theme.fonts.ui,
    fontSize: 16,
  },
  eye: {
    width: 48,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 26,
  },
  buttonText: { fontFamily: theme.fonts.uiSemibold, fontSize: 15 },
  error: { fontFamily: theme.fonts.ui, fontSize: 14, lineHeight: 22 },
});
