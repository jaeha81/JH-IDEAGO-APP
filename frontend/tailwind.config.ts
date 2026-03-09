import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // IDEAGO design tokens — arkistore-inspired minimal palette
        surface: {
          DEFAULT: "#1A1A1A",
          raised: "#242424",
          overlay: "#2E2E2E",
        },
        border: {
          DEFAULT: "#2A2A2A",
          subtle: "#222222",
          strong: "#3A3A3A",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#888888",
          muted: "#555555",
          inverse: "#0F0F0F",
        },
        accent: {
          DEFAULT: "#FFFFFF",
          hover: "#E5E5E5",
        },
        // Blue reserved for amounts/budget references only (per design brief)
        info: "#2563EB",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
