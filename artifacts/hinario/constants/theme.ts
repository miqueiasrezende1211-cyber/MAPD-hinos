import { Platform } from "react-native";

export const theme = {
  fonts: {
    ui: "Inter_400Regular",
    uiMedium: "Inter_500Medium",
    uiSemibold: "Inter_600SemiBold",
    uiBold: "Inter_700Bold",
    reading: "Merriweather_400Regular",
    heading: "Merriweather_700Bold",
    mono: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  touchTarget: 48,
  readingWidth: 760,
  contentWidth: 960,
} as const;
