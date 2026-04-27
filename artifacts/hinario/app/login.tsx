import React, { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, isAuthenticated, user, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin() {
    setErro(null);
    setLoading(true);
    try {
      await login(email, senha);
      router.replace("/admin");
    } catch {
      setErro("Falha no login. Verifique email e senha.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    setEmail("");
    setSenha("");
  }

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top + 20 },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Acesso Admin</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Faça login para cadastrar, editar e excluir letras e cifras.
      </Text>

      {isAuthenticated && user ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Sessão ativa
          </Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>
            {user.nome} ({user.email}) - {user.papel}
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => router.push("/admin")}
              style={[
                styles.button,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                Ir para Admin
              </Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={[
                styles.button,
                { backgroundColor: colors.secondary, borderRadius: colors.radius },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>
                Sair
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
              },
            ]}
            placeholderTextColor={colors.mutedForeground}
          />
          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder="Senha"
            secureTextEntry
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
              },
            ]}
            placeholderTextColor={colors.mutedForeground}
          />
          {erro ? <Text style={[styles.error, { color: "#d7263d" }]}>{erro}</Text> : null}
          <Pressable
            onPress={handleLogin}
            disabled={loading || !email || !senha}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: loading || !email || !senha ? 0.6 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                Entrar
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 30,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 8,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  input: {
    height: 46,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  button: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  error: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
});
