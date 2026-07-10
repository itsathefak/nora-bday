import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#060606",
        surface: "#111111",
        accent: "#e50914",
        text: "#f4f4f8",
      },
      boxShadow: {
        glow: "0 0 40px rgba(229, 9, 20, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
