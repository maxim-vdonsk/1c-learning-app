import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          red: "#ff2200",
          orange: "#ff8800",
          yellow: "#ffcc00",
          green: "#00ff88",
          blue: "#00aaff",
          purple: "#cc44ff",
        },
        cyber: {
          black: "#080810",
          dark: "#0d0d1a",
          card: "#111128",
          border: "#1e1e3a",
          muted: "#2a2a4a",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Orbitron", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-red": "0 0 20px rgba(255, 34, 0, 0.5)",
        "glow-orange": "0 0 20px rgba(255, 136, 0, 0.4)",
        "glow-green": "0 0 15px rgba(0, 255, 136, 0.4)",
        "glow-blue": "0 0 15px rgba(0, 170, 255, 0.4)",
        "card-glow": "0 4px 30px rgba(255, 34, 0, 0.1)",
      },
      animation: {
        "pulse-neon": "pulse 2s ease-in-out infinite",
        "scan-lines": "scan 4s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(255, 34, 0, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(255, 34, 0, 0.7)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
