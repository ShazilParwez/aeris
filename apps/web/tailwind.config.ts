import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          950: "#070C14",
          900: "#0B1220",
          800: "#142336",
          700: "#1D324D",
        },
        ivory: "#F7F9F6",
        cloud: "#E9EEF1",
        teal: {
          DEFAULT: "#149A86",
          light: "#75D9D0",
          dark: "#0F7666",
        },
        amber: {
          warm: "#E8AD4A",
          dark: "#B87F22",
        },
        coral: {
          signal: "#E87669",
          dark: "#C0493B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
