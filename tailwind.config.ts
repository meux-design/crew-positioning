import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF4F9",
          300: "#8FB8D6",
          500: "#2C6B9E",
          700: "#153A5B",
          900: "#0B1F33"
        },
        accent: {
          50: "#FCF1EA",
          500: "#D46A2E",
          600: "#B8541F"
        },
        neutral: {
          0: "#FFFFFF",
          100: "#F1F3F5",
          300: "#CBD1D7",
          600: "#5A6169",
          900: "#16191C"
        },
        state: {
          available: "#1F6B4A",
          limited: "#8A6410",
          unavailable: "#9B2C2C",
          info: "#2C6B9E"
        },
        surface: {
          page: "var(--color-surface-page)",
          raised: "var(--color-surface-raised)"
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)"
        },
        action: {
          primary: "var(--color-action-primary)",
          hover: "var(--color-action-primary-hover)"
        },
        border: {
          interactive: "var(--color-border-interactive)",
          decorative: "var(--color-border-decorative)"
        },
        focus: {
          ring: "var(--color-focus-ring)"
        }
      },
      borderRadius: {
        control: "4px",
        card: "8px",
        overlay: "12px"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SF Mono", "Menlo", "monospace"]
      },
      fontSize: {
        display: ["30px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.02em" }],
        h1: ["24px", { lineHeight: "1.25", fontWeight: "600", letterSpacing: "-0.015em" }],
        h2: ["20px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" }],
        h3: ["16px", { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400", letterSpacing: "0" }],
        bodySmall: ["14px", { lineHeight: "1.45", fontWeight: "400", letterSpacing: "0" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.01em" }],
        data: ["14px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0" }]
      }
    }
  },
  plugins: []
};

export default config;
