import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F4F1EA",
          dim: "#EBE7DD",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#1A1916",
          soft: "#3D3A33",
        },
        line: {
          DEFAULT: "#D5D0C4",
          soft: "#E2DED3",
        },
        vermilion: {
          DEFAULT: "#C7431F",
          dark: "#A83818",
          soft: "#F9E8E2",
        },
        moss: {
          DEFAULT: "#4A6B3A",
          soft: "#E8EFE2",
        },
        amber: {
          DEFAULT: "#B8862A",
          soft: "#F5EDDA",
        },
        sarvam: {
          DEFAULT: "#6B2FA0",
          soft: "#F0EAF5",
        },
        primary: {
          DEFAULT: "#C7431F",
          dark: "#A83818",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#EBE7DD",
          foreground: "#1A1916",
        },
        accent: {
          DEFAULT: "#EBE7DD",
          foreground: "#1A1916",
        },
        destructive: {
          DEFAULT: "#B91C1C",
          foreground: "#FFFFFF",
        },
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--vermilion)",
        background: "var(--paper)",
        foreground: "var(--ink)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--ink-soft)",
        },
        card: {
          DEFAULT: "var(--paper-card)",
          foreground: "var(--ink)",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
