import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { theme } from "@/constants/theme";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritosProvider } from "@/contexts/FavoritosContext";
import { HinosProvider } from "@/contexts/HinosContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: {
            fontFamily: theme.fonts.heading,
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerBackTitle: "Voltar",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="admin" options={{ title: "Administração" }} />
        <Stack.Screen name="admin-cadastro" options={{ title: "Cadastro" }} />
        <Stack.Screen
          name="admin-editar/[numero]"
          options={{ title: "Edição" }}
        />
        <Stack.Screen
          name="hino/[numero]/index"
          options={{ title: "", headerTransparent: false }}
        />
        <Stack.Screen
          name="hino/[numero]/cifra"
          options={{ title: "Cifra", headerTransparent: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
    Inter_500Medium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
    Inter_600SemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
    Merriweather_400Regular: require("@expo-google-fonts/merriweather/400Regular/Merriweather_400Regular.ttf"),
    Merriweather_700Bold: require("@expo-google-fonts/merriweather/700Bold/Merriweather_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FavoritosProvider>
              <HinosProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </HinosProvider>
            </FavoritosProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
