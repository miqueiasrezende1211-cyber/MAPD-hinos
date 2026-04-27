import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { listHinos } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

type ListItem = {
  numero: number;
  titulo: string;
  tom: string | null;
};

export default function AdminManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);

  async function refresh(search = query) {
    setLoading(true);
    try {
      const response = await listHinos(search);
      setItems(
        response.items.map((item) => ({
          numero: item.numero,
          titulo: item.titulo,
          tom: item.tom,
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, paddingTop: insets.top + 20 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Gerenciamento</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Faça login para acessar a gestão de hinos.
        </Text>
        <Pressable
          onPress={() => router.replace("/login")}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            Ir para Login
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top + 16 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{
          title: "Gerenciamento",
          headerRight: () => (
            <View style={styles.headerIcons}>
              <Pressable
                onPress={() => router.replace("/")}
                style={styles.headerIconHit}
                accessibilityLabel="Ir para início"
              >
                <Feather name="home" size={20} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/admin-cadastro")}
                style={styles.headerIconHit}
                accessibilityLabel="Novo cadastro"
              >
                <Feather name="plus" size={22} color={colors.foreground} />
              </Pressable>
            </View>
          ),
        }}
      />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Gerenciamento</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {user?.nome} ({user?.papel})
          </Text>
        </View>
        <Pressable
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          style={[
            styles.secondaryButton,
            { backgroundColor: colors.secondary, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
            Sair
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
        ]}
      >
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar hinos"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
                flex: 1,
              },
            ]}
          />
          <Pressable
            onPress={() => void refresh()}
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primaryForeground }]}>
              Buscar
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={{ gap: 8 }}>
            {items.map((item) => (
              <View
                key={item.numero}
                style={[
                  styles.rowItem,
                  { borderColor: colors.border, borderRadius: colors.radius },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemNumber, { color: colors.foreground }]}>
                    {item.numero}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.itemTitle, { color: colors.mutedForeground }]}
                  >
                    {item.titulo}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push(`/admin-editar/${item.numero}`)}
                  accessibilityLabel={`Editar hino ${item.numero}`}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 8 }]}
                >
                  <Feather name="edit-2" size={18} color={colors.foreground} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 2,
  },
  headerIconHit: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 28,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  rowItem: {
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  itemTitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  primaryButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  secondaryButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
