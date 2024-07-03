import daisyui from "daisyui";
import { Config } from "tailwindcss";
// @ts-ignore
import tailwindcssAnimated from "tailwindcss-animated";

const tailwind: Config = {
  content: [
    "./src/**/*.{js,tsx, ts}",
    "node_modules/daisyui/dist/**/*.js",
    "node_modules/react-daisyui/dist/**/*.js",
  ],
  darkMode: "class",
  plugins: [daisyui, tailwindcssAnimated],
};

export default tailwind;
