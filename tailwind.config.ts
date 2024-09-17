import textShadow from "@designbycode/tailwindcss-text-shadow";
import daisyui from "daisyui";
import { Config } from "tailwindcss";
import tailwindcssAnimated from "tailwindcss-animated";

const popup = "31.25rem";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "node_modules/daisyui/dist/**/*.js",
    "node_modules/react-daisyui/dist/**/*.js",
  ],
  theme: {
    extend: { width: { popup }, minWidth: { popup } },
  },
  daisyui: {
    themes: ["dark"],
  },
  darkMode: "media",
  plugins: [
    daisyui,
    tailwindcssAnimated,

    // @ts-ignore
    textShadow,
  ],
} satisfies Config;
