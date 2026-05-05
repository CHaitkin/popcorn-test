import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Warm neutral base — stone-leaning
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#fafaf9",
          muted: "#f5f5f4",
        },
        ink: {
          DEFAULT: "#1c1917",
          soft: "#44403c",
          mute: "#78716c",
          faint: "#a8a29e",
        },
        edge: {
          DEFAULT: "#e7e5e4",
          strong: "#d6d3d1",
        },
        accent: {
          DEFAULT: "#4f46e5",
          soft: "#eef2ff",
        },
        warn: {
          DEFAULT: "#b91c1c",
          soft: "#fef2f2",
          edge: "#fecaca",
        },
      },
      fontSize: {
        "2xs": ["11px", "16px"],
      },
      letterSpacing: {
        micro: "0.04em",
      },
    },
  },
  plugins: [],
};

export default config;
