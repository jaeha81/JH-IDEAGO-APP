import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ideago.app",
  appName: "IDEAGO",
  webDir: "out",

  server: {
    // Use https scheme to avoid mixed-content issues on Android
    androidScheme: "https",
  },

  android: {
    // Allow mixed HTTP/HTTPS content (needed for local dev API calls)
    allowMixedContent: true,
    // Disable WebView debugging in production
    webContentsDebuggingEnabled: false,
    // Dark background matching app theme
    backgroundColor: "#0F0F0F",
  },

  plugins: {
    Keyboard: {
      // Resize body instead of native scroll — better for fixed layouts
      resize: "body",
    },
    App: {},
  },
};

export default config;
