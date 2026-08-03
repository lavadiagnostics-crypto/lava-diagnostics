import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "2rem", lg: "2.5rem", xl: "3rem" },
      screens: { "2xl": "1360px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /** Brand tokens — fixed values, identical in both themes. */
        lava: {
          50: "#FFF3EF",
          100: "#FFE3DA",
          200: "#FFC5B4",
          300: "#FFA189",
          400: "#FF7C5C",
          500: "#FF5B2E",
          600: "#ED3F0F",
          700: "#C42F08",
          800: "#96280C",
          900: "#7A250F",
        },
        charcoal: {
          50: "#F6F6F6",
          100: "#E7E7E7",
          200: "#D1D1D1",
          300: "#B0B0B0",
          400: "#888888",
          500: "#6D6D6D",
          600: "#5D5D5D",
          700: "#4F4F4F",
          800: "#2E2E2E",
          900: "#1F1F1F",
          950: "#141414",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "4xl": "2rem",
      },
      letterSpacing: {
        tightest: "-0.045em",
        overline: "0.16em",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(31 31 31 / 0.04), 0 1px 3px 0 rgb(31 31 31 / 0.06)",
        card: "0 2px 4px -1px rgb(31 31 31 / 0.04), 0 12px 32px -8px rgb(31 31 31 / 0.10)",
        lift: "0 4px 8px -2px rgb(31 31 31 / 0.06), 0 24px 48px -12px rgb(31 31 31 / 0.16)",
        glow: "0 8px 32px -8px rgb(255 91 46 / 0.45)",
      },
      backgroundImage: {
        "lava-gradient": "linear-gradient(135deg, #FF7C5C 0%, #FF5B2E 45%, #ED3F0F 100%)",
        "grid-fade":
          "linear-gradient(to bottom, transparent, hsl(var(--background)) 78%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "50%": { transform: "translate3d(0,-18px,0) rotate(6deg)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.55" },
          "80%,100%": { transform: "scale(1.9)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.22s ease-out",
        "accordion-up": "accordion-up 0.22s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.8s infinite",
        drift: "drift 14s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.24,0.6,0.35,1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
